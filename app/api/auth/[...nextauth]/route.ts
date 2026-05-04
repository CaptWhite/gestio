import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { createClient } from "ldapjs"

interface LDAPUser {
  dn: string
  attrs: any[]
}

async function authenticateWithLDAP(email: string, password: string): Promise<LDAPUser | null> {
  return new Promise((resolve, reject) => {
    const ldapUrl = process.env.LDAP_URL
    const baseDN = process.env.LDAP_BASE_DN
    const bindDN = process.env.LDAP_BIND_DN
    const bindPW = process.env.LDAP_BIND_PW
    const groupDN = "cn=gestors,ou=groups,dc=aster,dc=cat"
    
    const client = createClient({ url: ldapUrl })
    
    client.on("error", (err: Error) => {
      reject(err)
    })
    
    client.bind(bindDN, bindPW, (bindErr: Error | null) => {
      if (bindErr) {
        client.destroy()
        reject(bindErr)
        return
      }
      
      const searchOpts = {
        filter: `(&(objectClass=inetOrgPerson)(mail=${email}))`,
        scope: "sub" as const,
        attributes: ["cn", "sn", "givenName", "mail", "memberOf"]
      }
      
      client.search(baseDN, searchOpts, (searchErr: Error | null, res: any) => {
        if (searchErr) {
          client.destroy()
          reject(searchErr)
          return
        }
        
        let userDN: string | null = null
        let userAttrs: any = null
        
        res.on("searchEntry", (entry: any) => {
          userDN = entry.dn.toString()
          userAttrs = entry.pojo.attributes
        })
        
        res.on("error", (err: Error) => {
          client.destroy()
          reject(err)
        })
        
        res.on("end", () => {
          if (!userDN) {
            client.destroy()
            resolve(null)
            return
          }
          
          client.bind(userDN, password, (authErr: Error | null) => {
            if (authErr) {
              client.destroy()
              resolve(null)
              return
            }
            
            const groupClient = createClient({ url: ldapUrl })
            groupClient.bind(bindDN, bindPW, (gbErr: Error | null) => {
              if (gbErr) {
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
        const email = credentials?.email || credentials?.username
        const password = credentials?.password
        if (!email || !password) {
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