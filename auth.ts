import { getServerSession } from "next-auth"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { createClient } from "ldapjs"

export const dynamic = "force-dynamic"

export { getServerSession }

interface LDAPUser {
  dn: string
  attrs: any[]
}

async function authenticateWithLDAP(email: string, password: string): Promise<LDAPUser | null> {
  return new Promise((resolve, reject) => {
    const ldapUrl = process.env.LDAP_URL || "ldap://localhost:389"
    const baseDN = process.env.LDAP_BASE_DN || "dc=aster,dc=cat"
    const bindDN = process.env.LDAP_BIND_DN || "cn=admin,dc=aster,dc=cat"
    const bindPW = process.env.LDAP_BIND_PW || "ASTER@admin"

    console.log("[LDAP] Searching for email:", email)
    const groupDN = "cn=gestors,ou=groups,dc=aster,dc=cat"
    
    const client = createClient({ url: ldapUrl })
    
    client.on("error", (err: Error) => {
      console.error("[LDAP] Client error:", err.message)
      reject(err)
    })
    
    client.bind(bindDN, bindPW, (bindErr: Error | null) => {
      if (bindErr) {
        console.error("[LDAP] Initial bind error:", bindErr.message)
        client.destroy()
        reject(bindErr)
        return
      }
      
      console.log("[LDAP] Initial bind successful")
      
      const searchOpts = {
        filter: `(&(objectClass=inetOrgPerson)(mail=${email}))`,
        scope: "sub" as const,
        attributes: ["cn", "sn", "givenName", "mail", "memberOf"]
      }
      
      client.search(baseDN, searchOpts, (searchErr: Error | null, res: any) => {
        if (searchErr) {
          console.error("[LDAP] Search error:", searchErr.message)
          client.destroy()
          reject(searchErr)
          return
        }
        
        let userDN: string | null = null
        let userAttrs: any = null
        
        res.on("searchEntry", (entry: any) => {
          userDN = entry.dn.toString()
          userAttrs = entry.pojo.attributes
          console.log("[LDAP] Search entry DN:", userDN)
          console.log("[LDAP] Attributes:", JSON.stringify(userAttrs))
        })
        
        res.on("error", (err: Error) => {
          console.error("[LDAP] Search result error:", err.message)
          client.destroy()
          reject(err)
        })
        
        res.on("end", () => {
          if (!userDN) {
            console.log("[LDAP] User not found:", email)
            client.destroy()
            resolve(null)
            return
          }
          
          console.log("[LDAP] Found user DN:", userDN)
          
          client.bind(userDN, password, (authErr: Error | null) => {
            if (authErr) {
              console.log("[LDAP] Authentication failed for:", email)
              client.destroy()
              resolve(null)
              return
            }
            
            console.log("[LDAP] Authentication successful")
            
            const groupClient = createClient({ url: ldapUrl })
            groupClient.bind(bindDN, bindPW, (gbErr: Error | null) => {
              if (gbErr) {
                console.error("[LDAP] Group bind error:", gbErr.message)
                client.destroy()
                groupClient.destroy()
                resolve(userAttrs && userDN ? { dn: userDN, attrs: userAttrs } : null)
                return
              }
              
              const groupSearchOpts = {
                filter: `(&(objectClass=groupOfNames)(member=${userDN}))`,
                scope: "sub" as const,
                attributes: ["cn"]
              }
              
              groupClient.search(groupDN, groupSearchOpts, (gsErr: Error | null, gres: any) => {
                if (gsErr) {
                  console.error("[LDAP] Group search error:", gsErr.message)
                  groupClient.destroy()
                  client.destroy()
                  resolve(userAttrs && userDN ? { dn: userDN, attrs: userAttrs } : null)
                  return
                }
                
                let isGestor = false
                
                gres.on("searchEntry", () => {
                  isGestor = true
                })
                
                gres.on("end", () => {
                  groupClient.destroy()
                  client.destroy()
                  
                  console.log("[LDAP] User is gestor:", isGestor)
                  
                  if (isGestor) {
                    resolve(userAttrs && userDN ? { dn: userDN, attrs: userAttrs } : null)
                  } else {
                    resolve(null)
                  }
                })
              })
            })
          })
        })
      })
    })
  })
}

const authOptions = {
  secret: process.env.AUTH_SECRET,
  useSecureCookies: false,
  sessionStrategy: "jwt",
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials: any) {
        console.log("[Authorize] Received ALL credentials:", JSON.stringify(credentials))
        const email = credentials?.email || credentials?.username
        const password = credentials?.password
        console.log("[Authorize] Using email:", email, "password set:", !!password)
        if (!email || !password) {
          console.log("[Authorize] Missing credentials")
          return null
        }

        const user = await authenticateWithLDAP(email, password)
        
        if (user && user.dn && user.attrs) {
          const getAttr = (attrs: any[], name: string) => {
            const attr = attrs.find((a: any) => a.type === name)
            return attr?.values?.[0] || null
          }
          
          return {
            id: user.dn as string,
            name: getAttr(user.attrs, "givenName") || getAttr(user.attrs, "sn") || email as string,
            email: getAttr(user.attrs, "mail") || email as string
          }
        }
        
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
      }
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
      }
      return session
    }
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

export { authOptions }