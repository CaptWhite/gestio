# ASTER Gestió - Especificació de l'Aplicació

**Projecte:** Gestió Administrativa ASTER  
**Versió:** 0.1.0  
**Stack tecnològic:** Next.js 14.1.0 / React 18 / TypeScript / Tailwind CSS / MySQL / Docker  
**Data:** Juliol 2026

---

## 1. Visió General

### 1.1 Descripció

**Gestio** és una aplicació web de gestió administrativa dissenyada per a l'**Agrupació Astronòmica de Barcelona (ASTER)**. L'aplicació permet gestionar socis, inscripcions, tasques, cartes de comunicació i configuració general de l'entitat.

### 1.2 Objectius

- Centralitzar la gestió de socis (altes, baixes, modificacions)
- Automatitzar el procés d'inscripció de nous socis des del web
- Gestionar tasques administratives amb seguiment d'estat
- Plantilles de cartes de comunicació amb enviament de correu electrònic
- Integració amb OpenLDAP per a gestió d'usuaris
- Dashboard amb mètriques i activitat recent

### 1.3 Usuaris Objectiu

- Secretaria de l'associació ASTER
- Tresoreria
- Administració general

---

## 2. Arquitectura del Sistema

### 2.1 Stack Tecnològic

| Capa | Tecnologia | Versió |
|------|-----------|--------|
| Frontend | Next.js (App Router) | 14.1.0 |
| UI Framework | React | 18.2.0 |
| Estils | Tailwind CSS | 3.4.1 |
| Llenguatge | TypeScript | 5.3.3 |
| Backend API | Next.js API Routes | - |
| Base de Dades | MySQL | InnoDB / utf8mb4 |
| ORM/Driver | mysql2 | 3.22.2 |
| Autenticació | NextAuth.js | 4.24.14 |
| Directori LDAP | OpenLDAP (docker) | - |
| Correu | Gmail API (OAuth2) | googleapis 134.0.0 |
| Contenidorització | Docker + Docker Compose | - |
| Desplegament | Next.js standalone | - |

### 2.2 Estructura de Directoris

```
Gestio/
├── app/                          # Next.js App Router
│   ├── api/                      # Endpoints REST
│   │   ├── auth/[...nextauth]/   # Autenticació NextAuth
│   │   ├── cartes/               # API de cartes
│   │   ├── customers/            # API de socis
│   │   ├── inscriptions/         # API d'inscripcions
│   │   ├── settings/             # API de configuració
│   │   └── tasks/                # API de tasques
│   ├── cartes/                   # Pàgines de cartes
│   ├── customers/                # Pàgines de socis
│   ├── inscriptions/             # Pàgines d'inscripcions
│   ├── login/                    # Pàgina de login
│   ├── settings/                 # Pàgina de configuració
│   ├── tasks/                    # Pàgines de tasques
│   ├── layout.tsx                # Layout arrel
│   └── page.tsx                  # Dashboard principal
├── components/                   # Components React reutilitzables
├── lib/                          # Biblioteques compartides
│   ├── auth.ts                   # Lògica d'autenticació LDAP
│   ├── db.ts                     # Pool de connexió MySQL
│   ├── google-sheets.ts          # Integració Google Sheets
│   ├── sendMails.ts              # Enviament de correus
│   └── utils.ts                  # Utilitats (cn, etc.)
├── _batch/                       # Scripts batch
├── _scripts/                     # Scripts SQL
├── docker-compose.yml            # Configuració Docker
└── Dockerfile                    # Imatge Docker
```

---

## 3. Model de Base de Dades

### 3.1 Diagrama de Taules

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   config    │     │    socis    │     │   tasques   │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id (PK)     │     │ id (PK)     │     │ id (PK)     │
│ nom         │     │ id_socis    │     │ title       │
│ correu      │     │ sexe        │     │ type        │
│ ult_inscripcio│   │ cognoms     │     │ status      │
│ header      │     │ nom         │     │ priority    │
│ footer      │     │ dni         │     │ payload     │
│ date_create │     │ data_neix   │     │ date_create │
│ date_update │     │ adreca      │     │ date_update │
└─────────────┘     │ poblacio    │     └─────────────┘
                    │ professio   │
┌─────────────┐     │ mobil       │     ┌─────────────┐
│   cartes    │     │ telefon_fix │     │registre_log │
├─────────────┤     │ correu_e_1  │     ├─────────────┤
│ id (PK)     │     │ correu_e2   │     │ id (PK)     │
│ title       │     │ observacions│     │ descripcio  │
│ _to         │     │ data_alta   │     │ date_create │
│ _cc         │     │ cobrament_inicial│ │ date_update │
│ _cco        │     │ data_baixa  │     └─────────────┘
│ subject     │     │ comptecorrent│
│ body        │     │ motiu_baixa │
│ bodyFem     │     │ quota       │
│ date_create │     │ date_create │
│ date_update │     │ date_update │
└─────────────┘     └─────────────┘
```

### 3.2 Taules Detall

#### 3.2.1 `socis` - Taulell de socis

| Camp | Tipus | Descripció |
|------|-------|------------|
| id | INT AUTO_INCREMENT PK | ID intern |
| id_socis | INT | Num de soci |
| sexe | VARCHAR(255) | H=Home, D=Dona, A=Altre |
| cognoms | VARCHAR(255) | Cognoms |
| nom | VARCHAR(255) | Nom |
| dni | VARCHAR(255) | DNI/NIF |
| data_neix | DATETIME | Data de naixement |
| adreca | VARCHAR(255) | Adreça postal |
| poblacio | VARCHAR(255) | Població |
| professio | VARCHAR(255) | Professió |
| mobil | VARCHAR(255) | Telefon mòbil |
| telefon_fix | VARCHAR(255) | Telefon fix |
| correu_e_1 | VARCHAR(255) | Correu electrònic principal |
| correu_e2 | VARCHAR(255) | Correu electrònic secundari |
| observacions | VARCHAR(255) | Observacions |
| data_alta | DATETIME | Data d'alta |
| cobrament_inicial | VARCHAR(255) | Forma de cobrament inicial |
| data_baixa | DATETIME | Data de baixa |
| comptecorrent | VARCHAR(255) | IBAN |
| motiu_baixa | VARCHAR(255) | Motiu de la baixa |
| quota | VARCHAR(255) | Quota |
| date_create | TIMESTAMP | Data de creació del registre |
| date_update | TIMESTAMP | Data d'actualització |

#### 3.2.2 `tasques` - Taulell de tasques

| Camp | Tipus | Descripció |
|------|-------|------------|
| id | INT AUTO_INCREMENT PK | ID intern |
| title | VARCHAR(255) NOT NULL | Títol de la tasca |
| type | VARCHAR(100) | Tipus (manual, Inscripcio) |
| status | VARCHAR(50) | Estat (pending, completed) |
| priority | VARCHAR(50) | Prioritat (high, medium, low) |
| payload | VARCHAR(3000) | JSON amb dades extres |
| date_create | TIMESTAMP | Data de creació |
| date_update | TIMESTAMP | Data d'actualització |

**Nota:** Les inscripcions web es guarden com a tasques amb títol que comença per "Inscripció de soci per web" i type="Inscripcio".

#### 3.2.3 `cartes` - Taulell de plantilles de cartes

| Camp | Tipus | Descripció |
|------|-------|------------|
| id | INT AUTO_INCREMENT PK | ID intern |
| title | VARCHAR(255) NOT NULL | Nom de la carta |
| _to | VARCHAR(500) | Destinatari (To) |
| _cc | VARCHAR(100) | CC |
| _cco | VARCHAR(100) | CCO |
| subject | VARCHAR(500) | Assumpte |
| body | VARCHAR(5000) | Cos de la carta (Home/Altre) |
| bodyFem | VARCHAR(5000) | Cos de la carta (Dona) |
| date_create | TIMESTAMP | Data de creació |
| date_update | TIMESTAMP | Data d'actualització |

**Lògica de selecció de body:** Si `sexe === 'D'` s'utilitza `bodyFem`, en cas contrari `body`.

#### 3.2.4 `config` - Taulell de configuració

| Camp | Tipus | Descripció |
|------|-------|------------|
| id | INT AUTO_INCREMENT PK | ID intern |
| nom | TEXT | Nom de l'entitat/secretaria |
| correu | TEXT | Correu de contacte |
| ult_inscripcio | INT | Últim número d'inscripció processat |
| header | VARCHAR(2000) | Capçalera HTML per a les cartes |
| footer | VARCHAR(1000) | Peu de pàgina HTML per a les cartes |
| date_create | TIMESTAMP | Data de creació |
| date_update | TIMESTAMP | Data d'actualització |

#### 3.2.5 `registre_log` - Taulell de registre d'activitat

| Camp | Tipus | Descripció |
|------|-------|------------|
| id | INT AUTO_INCREMENT PK | ID intern |
| descripcio | TEXT | Descripció de l'activitat |
| date_create | TIMESTAMP | Data de creació |
| date_update | TIMESTAMP | Data d'actualització |

---

## 4. Endpoints API

### 4.1 Autenticació

| Endpoint | Métodes | Descripció |
|----------|---------|------------|
| `/api/auth/[...nextauth]` | GET, POST | Handler NextAuth.js |
| `/api/debug/simple-login` | POST | Login LDAP simple (debug) |

### 4.2 Socis (`/api/customers`)

| Métode | Paràmetres | Descripció |
|--------|-----------|------------|
| GET | `?mode=stats` | Estadístiques: socis actius, homes, dones, altes mensuals, activitat recent |
| GET | `?mode=nextId` | Proper ID de soci |
| GET | (sense params) | Llistat complet de socis |
| PUT | body JSON | Actualitzar soci |
| POST | body JSON | Crear nou soci |

**GET /api/customers (sense params)**
```json
[
  {
    "id": 1,
    "id_socis": 2499,
    "sexe": "H",
    "cognoms": "Aragonés i Perales",
    "nom": "Joan",
    "dni": "37739790X",
    "data_neix": "1961-12-22",
    "adreca": "Av. Pompeu Fabra 19-21",
    "poblacio": "08024 Barcelona",
    "professio": "Enginyer ind. jubilat",
    "mobil": "609303801",
    "telefon_fix": "932848692",
    "correu_e_1": "aragones.joan@gmail.com",
    "correu_e2": null,
    "observacions": null,
    "data_alta": "1981-01-01",
    "cobrament_inicial": null,
    "data_baixa": null,
    "comptecorrent": "ES94 3025 0001 1714 3307 0353",
    "motiu_baixa": null,
    "quota": null
  }
]
```

**GET /api/customers?mode=stats**
```json
{
  "totalActive": 150,
  "homes": 120,
  "dones": 30,
  "monthlyData": [0, 0, 5, 3, 0, ...],
  "currentYear": 2026,
  "recentActivity": [
    {
      "descripcio": "Alta automàtica de soci...",
      "date_update": "2026-05-13T10:00:00",
      "time": "13/05/2026 10:00"
    }
  ]
}
```

### 4.3 Tasques (`/api/tasks`)

| Métode | Paràmetres | Descripció |
|--------|-----------|------------|
| GET | `?mode=stats` | Estadístiques: total, pendents, completades, tasques recents |
| GET | (sense params) | Llistat de totes les tasques |
| POST | `{ action: 'toggle', id }` | Alternar estat pending/completed |
| POST | `{ title, type, priority, status }` | Crear nova tasca |
| DELETE | `{ id }` | Eliminar tasca |

**GET /api/tasks (sense params)**
```json
[
  {
    "id": 1,
    "title": "Revisar proposta tècnica",
    "type": "manual",
    "status": "pending",
    "priority": "high",
    "payload": "{}",
    "date": "2026-05-13"
  }
]
```

### 4.4 Tasques per ID (`/api/tasks/[id]`)

| Métode | Descripció |
|--------|------------|
| GET | Obtenir una tasca concreta |
| PUT | Actualitzar tasca (title, priority, type, payload) |

### 4.5 Inscripcions (`/api/inscriptions`)

| Métode | Descripció |
|--------|------------|
| GET | Llistat d'inscripcions (tasques amb títol "Inscripció de soci per web%") |
| POST | Alternar pagament + procés complet d'alta de soci |

**POST /api/inscriptions (procés complet)**
```json
Request: { "id": 123, "sexe": "H" }

Response: { "success": true, "pagat": "si" }
```

**Procés d'alta automàtica (quan pagat="si"):**
1. Parsejar payload JSON
2. Verificar si el camp "sexe" existeix al payload
3. Si no existeix, demanar selecció (H/D/A) via modal
4. Extracte de dades del membre del payload
5. Verificar duplicats per DNI
6. Calcular proper id_socis (MAX(id_socis)+1)
7. Insertar a taula `socis`
8. Registrar log a `registre_log`
9. Crear usuari a OpenLDAP (grup "gestors")
10. Enviar "Carta de presentacio" per correu
11. Enviar "Notificació Alta de Soci" per correu

### 4.6 Cartes (`/api/cartes`)

| Métode | Descripció |
|--------|------------|
| GET | Llistat de totes les cartes |
| PUT | Actualitzar carta (inclòs bodyFem) |
| POST | Crear nova carta |

### 4.7 Test Mail (`/api/cartes/testMail`)

| Métode | Descripció |
|--------|------------|
| POST | Enviar correu de prova amb paràmetres custom |

```json
Request: {
  "cartaTitle": "Carta de presentacio",
  "to": "correu@exemple.com",
  "cc": "",
  "cco": "",
  "sexe": "H"
}

Response: { "success": true, "messageId": "18f3a..." }
```

### 4.8 Configuració (`/api/settings`)

| Métode | Descripció |
|--------|------------|
| GET | Obtenir configuració (nom, correu, header, footer) |
| POST | Actualitzar configuració |

---

## 5. Pàgines de la Interfície

### 5.1 Rutes

| Ruta | Pàgina | Descripció |
|------|--------|------------|
| `/` | Dashboard | Resum d'activitat i mètriques |
| `/login` | Login | Formulari d'inici de sessió |
| `/customers` | Socis | Llistat de socis amb cerca i filtres |
| `/cartes` | Cartes | Llistat de plantilles de cartes |
| `/cartes/new` | Nova Carta | Formulari de creació de carta |
| `/cartes/testMail/[id]` | Prova Correu | Formulari d'enviament de prova |
| `/inscriptions` | Inscripcions | Llistat d'inscripcions web |
| `/inscriptions/view/[id]` | Detalls Inscripció | Visualització de dades d'inscripció |
| `/tasks` | Tasques | Llistat de tasques amb filtres |
| `/tasks/edit/[id]` | Editar Tasca | Formulari d'edició de tasca |
| `/settings` | Configuració | Configuració general |

### 5.2 Dashboard (`/`)

**Mètriques mostrades:**
- Socis Actius (total, homes, dones)
- Altes de l'any actual (per mes)
- Gestió de Tasques (total, pendents, completades)

**Seccions:**
- Activitat recent (últims 5 registres de `registre_log`)
- Properes tasques (últimes 4 tasques per data)

### 5.3 Pàgina de Login

**Components:**
- Formulari amb camp email i contrasenya
- Botó "Iniciar sessió"
- Enllaç "Accedir amb credencials LDAP" (debug)
- Missatges d'error

**Flux d'autenticació:**
1. Intent de login amb NextAuth (credentials provider)
2. Credencials verificades contra OpenLDAP via `ldapsearch` + `ldapbind`
3. Verificació de pertinença al grup "gestors" (`cn=gestors,ou=groups,dc=aster,dc=cat`)
4. Cookie de sessió establerta

### 5.4 Pàgina de Socis (`/customers`)

**Funcionalitats:**
- Llistat amb taules ordenables (ID, Cognoms, Nom, Correu, Mòbil, Data alta, Data baixa)
- Cerca per nom, cognoms, correu, mòbil, ID
- Filtre per estat: Tots, Socis Alta, Socis Baixa
- Botó "Afegir Soci" → modal AddCustomerModal
- Botó Excel per exportar
- Botó Editar → modal EditCustomerModal

### 5.5 Pàgina de Cartes (`/cartes`)

**Funcionalitats:**
- Llistat amb taules ordenables (ID, Títol, Per a, CC, Subject)
- Cerca per títol, destinatari, assumpte
- Botó "Afegir Carta" → pàgina /cartes/new
- Botó Editar → modal EditCartaModal
- Botó Enviar (icona Send) → pàgina /cartes/testMail/[id]

### 5.6 Pàgina Nova Carta (`/cartes/new`)

**Camps del formulari:**
- Titol (requerit)
- Per a (To)
- CC
- CCO
- Subject
- Cos de la carta (Home) - textarea ampli
- Cos de la carta (Dona) - textarea ampli

**Accions:**
- "Cancelar" → tornar a /cartes sense desar
- "Crear Carta" → POST /api/cartes

### 5.7 Pàgina Prova Correu (`/cartes/testMail/[id]`)

**Camps del formulari (modificables):**
- Per a (To)
- CC
- CCO
- Sexe (select: H-Home, D-Dona, A-Altre)

**Accions:**
- "Tornar" → tornar a /cartes
- "Enviar" → POST /api/cartes/testMail

### 5.8 Pàgina Inscripcions (`/inscriptions`)

**Funcionalitats:**
- Llistat d'inscripcions web (tasques amb títol "Inscripció de soci per web%")
- Botó circular per marcar/desmarcar pagat
- Icona d'editar → pàgina /inscriptions/view/[id]

**Modal de Sexe:**
Quan es marca una inscripció com a pagada i el payload no conté el camp "seuxe":
- Obre modal per seleccionar: H-Home, D-Dona, A-Altre
- Mostra nom i cognoms del soci
- Botó "Cancelar" (tanca modal)
- Botó "Continuar" (desa sexe i continua amb el procés)

### 5.9 Pàgina Tasques (`/tasks`)

**Funcionalitats:**
- Filtres: Todas, Pendents, Completades
- Botó "Nova Tasca" → modal AddTaskModal
- Botó completar (icona circular)
- Botó editar → /tasks/edit/[id]
- Botó eliminar (icona paperera)

---

## 6. Components React

### 6.1 Components de LAYOUT

| Component | Arxiu | Descripció |
|-----------|-------|------------|
| `Sidebar` | `components/Sidebar.tsx` | Barra lateral de navegació |
| `Providers` | `components/Providers.tsx` | Proveïdor NextAuth |
| `MetricCard` | `components/MetricCard.tsx` | Targeta de mètrica |

### 6.2 Components de Taules

| Component | Arxiu | Descripció |
|-----------|-------|------------|
| `CustomerTable` | `components/CustomerTable.tsx` | Taulell de socis ordenable |
| `CartesTable` | `components/CartesTable.tsx` | Taulell de cartes ordenable |

### 6.3 Modals

| Component | Arxiu | Descripció |
|-----------|-------|------------|
| `AddCustomerModal` | `components/AddCustomerModal.tsx` | Modal per afegir soci |
| `EditCustomerModal` | `components/EditCustomerModal.tsx` | Modal per editar soci (20 camps) |
| `AddTaskModal` | `components/AddTaskModal.tsx` | Modal per afegir tasca |
| `EditCartaModal` | `components/EditCartaModal.tsx` | Modal per editar carta |

### 6.4 Sidebar - Navegació

```
Dashboard    → /
Socis        → /customers
Cartes       → /cartes
Tasques      → /tasks
Inscripcions → /inscriptions
Configuració → /settings
```

---

## 7. Sistema d'Autenticació

### 7.1 Mecanisme Dual

L'aplicació suporta dos sistemes d'autenticació:

1. **NextAuth.js** - Cookie `next-auth.session-token`
2. **Simple Session** - Cookie `session-token` (Base64 amb expiració)

### 7.2 Flux d'Autenticació LDAP

```
1. Usuari introdueix email i contrasenya
2. Cercar a LDAP per (mail=email OR uid=username)
3. Obtenir DN de l'usuari
4. Intentar bind (ldapsearch) amb DN + contrasenya
5. Si OK → Verificar pertinença al grup "gestors"
6. Si és membre → Crear sessió i redirect a /
7. Si no → Rebutjar
```

### 7.3 Middleware de Protecció

El middleware de Next.js protegeix les rutes:
- Redirigeix a `/login` si no autenticat
- Permet accés sense autenticació a: `/login`, `/api/auth/*`, `/api/debug/*`
- Desactivable amb variable d'entorn `ENABLE_AUTH=false`

### 7.4 DN d'Autenticació LDAP

**DNs d'usuari:**
```
uid=joan.aragones.i.perales,ou=users,dc=aster,dc=cat
```

**DN del grup:**
```
cn=gestors,ou=groups,dc=aster,dc=cat
```

**DN de bind (admin):**
```
cn=admin,dc=aster,dc=cat
```

### 7.5 Variables d'Entorn necessàries

```env
LDAP_URL=ldap://ldap-server:389
LDAP_BASE_DN=dc=aster,dc=cat
LDAP_BIND_DN=cn=admin,dc=aster,dc=cat
LDAP_BIND_PW=...
AUTH_SECRET=...
ENABLE_AUTH=true
```

---

## 8. Mòdul de Correu Electrònic

### 8.1 Funcionament

El mòdul `lib/sendMails.ts` gestiona l'enviament de correus mitjançant l'API de Gmail (OAuth2).

### 8.2 Funció principal: `sendMail`

```typescript
sendMail(cartaTitle: string, memberData: TemplateVars, mailOverrides?: MailOverrides)
```

**Paràmetres:**
- `cartaTitle`: Títol de la carta plantilla (cerca a taula `cartes`)
- `memberData`: Variables del template (nom, cognoms, sexe, etc.)
- `mailOverrides`: (Opcional) Sobreescriure To, CC, CCO

### 8.3 Variables de Template

```typescript
interface TemplateVars {
  nom?: string;
  cognoms?: string;
  email?: string;
  dni?: string;
  adreca?: string;
  poblacio?: string;
  telefon_fix?: string;
  mobil?: string;
  sexe?: string;       // H, D, A
}
```

### 8.4 Lògica de Selecció de Body

```
Si sexe === 'D' AND bodyFem existeix:
  → Utilitzar bodyFem
Altrament:
  → Utilitzar body
```

### 8.5 Plantilla HTML

```html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
  ${config.header}    <!-- Capçalera de config -->
  ${bodyRendered}     <!-- Body en Markdown → HTML -->
  ${config.footer}    <!-- Peu de pàgina de config -->
</body>
</html>
```

### 8.6 Correus Enviats Automàticament

| Moment | Carta | Destinatari |
|--------|-------|-------------|
| Alta de soci | "Carta de presentacio" | Nou soci |
| Alta de soci | "Notificació Alta de Soci " | Secretaria |

### 8.7 Credencials Gmail

```env
MAIL_USERNAME=secretaria@aster.cat
OAUTH_CLIENTID=...
OAUTH_SECRET=...
OAUTH_REF_TOKEN=...
```

---

## 9. Scripts Batch

### 9.1 `carta_presentacio.ts`

Script per enviar la carta de presentació manualment.

**Funcionament:**
1. Llegeix carta de BD (taula `cartes`)
2. Llegeix header/footer de BD (taula `config`)
3. Substitueix variables de template
4. Envia correu via Gmail API

### 9.2 `get_inscriptions.ts`

Script per obtenir inscripcions de la BD remota (WordPress/DinaServer) i desar-les a la BD local.

**Flux:**
1. Llegeix `ult_inscripcio` de taula `config`
2. Consulta BD remota per la inscripció següent
3. Transforma JSON a format intern
4. Insereix a taula `tasques` com a tasca pendent
5. Registra log a `registre_log`

---

## 10. Desplegament

### 10.1 Docker

**Fitxers:**
- `Dockerfile` - Imatge multi-stage
- `docker-compose.yml` - Configuració local
- `docker-compose-prod.yml` - Configuració producció

**Serveis:**
- `app` - Aplicació Next.js
- `db` - MySQL 8
- `ldap-server` - OpenLDAP

### 10.2 Variables d'Entorn (Mínimes)

```env
# Base de dades
DB_HOST=db
DB_USER=...
DB_PASSWORD=...
DB_DATABASE=...

# Autenticació
AUTH_SECRET=...
ENABLE_AUTH=true
NEXTAUTH_URL=http://localhost:3000

# LDAP
LDAP_URL=ldap://ldap-server:389
LDAP_BASE_DN=dc=aster,dc=cat
LDAP_BIND_DN=cn=admin,dc=aster,dc=cat
LDAP_BIND_PW=...

# Gmail
MAIL_USERNAME=secretaria@aster.cat
OAUTH_CLIENTID=...
OAUTH_SECRET=...
OAUTH_REF_TOKEN=...
```

---

## 11. Endpoints API - Referència Ràpida

| Endpoint | GET | POST | PUT | DELETE |
|----------|-----|------|-----|--------|
| `/api/customers` | Llistat/Stats/NextId | Crear soci | Actualitzar soci | - |
| `/api/tasks` | Llistat/Stats | Crear/Alternar | - | Eliminar |
| `/api/tasks/[id]` | Obtenir | - | Actualitzar | - |
| `/api/inscriptions` | Llistat | Processar pagament | - | - |
| `/api/cartes` | Llistat | Crear carta | Actualitzar carta | - |
| `/api/cartes/testMail` | - | Enviar prova | - | - |
| `/api/settings` | Obtenir config | Actualitzar config | - | - |

---

## 12. Fluxos de Negoci

### 12.1 Inscripció Nou Soci (Automàtic)

```
Web → WordPress Form → DinaServer BD
  ↓
get_inscriptions.ts → Llegeix ult_inscripcio
  ↓
Transforma JSON → Insereix a tasques (status=pending)
  ↓
Usuari veu a /inscriptions → Marca com a pagat
  ↓
Verificar camp "seuxe" al payload
  ↓ (si no existeix)
Modal selecció sexe → H/D/A
  ↓
POST /api/inscriptions { id, sexe }
  ↓
1. Actualitzar payload.pagat = "si"
2. Extreure dades del payload
3. Verificar duplicat per DNI
4. INSERT a socis (next id_socis = MAX+1)
5. Log a registre_log
6. Crear usuari LDAP (grup gestors)
7. Enviar "Carta de presentacio"
8. Enviar "Notificació Alta de Soci"
```

### 12.2 Enviament Carta de Prova

```
/cartes → Clic icona Enviar → /cartes/testMail/[id]
  ↓
Modificar To, CC, CCO, Sexe
  ↓
Clic "Enviar" → POST /api/cartes/testMail
  ↓
1. Obtenir carta per títol
2. Seleccionar body/bodyFem segons sexe
3. Renderitzar Markdown a HTML
4. Afegir header/footer de config
5. Enviar via Gmail API
6. Retornar message ID
```

---

## 13. Integracions Externes

### 13.1 OpenLDAP

- **Contenidor Docker:** ldap-server
- **Base DN:** dc=aster,dc=cat
- **Usuaris:** ou=users,dc=aster,dc=cat
- **Grups:** ou=groups,dc=aster,dc=cat
- **Grup gestors:** cn=gestors,ou=groups,dc=aster,dc=cat
- **Operacions:** ldapsearch (cerca), ldapbind (autenticació), ldapadd (alta)

### 13.2 Gmail API (OAuth2)

- **Client:** OAuth2 amb refresh token
- **Remitent:** secretaria@aster.cat
- **Format:** HTML (Markdown → HTML via markdown-it)
- **Encoding:** UTF-8, Base64 per a Subject

### 13.3 Google Sheets

- **Llibreria:** googleapis
- **Ús:** Importar/exportar dades (mòdul `lib/google-sheets.ts`)

---

## 14. Convencions de Codi

### 14.1 Estil

- **Llenguatge:** TypeScript estrict
- **CSS:** Tailwind CSS utility-first
- **Icons:** lucide-react
- **Nomenclatura:** camelCase (variables), PascalCase (components)
- **Fitxers:** kebab-case per pàgines, PascalCase per components

### 14.2 Estructura d'un Endpoint API

```typescript
// 1. Check auth
const authEnabled = process.env.ENABLE_AUTH !== 'false';
if (authEnabled) {
  const session = await getServerSession(authOptions);
  const hasSimpleSession = await checkSimpleSession();
  if (!session && !hasSimpleSession) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
}

// 2. Execute query
const [rows] = await pool.query('...');

// 3. Return response
return NextResponse.json(data);
```

### 14.3 Estructura d'un Component

```tsx
"use client";

import { useState, useEffect } from "react";

export default function MyPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => { ... };

  return ( ... );
}
```

---

## 15. Pendents i Millora

### 15.1 Funcionalitats Pendents

- [ ] Exportar socis a Excel (ja implementat)
- [ ] Importar socis des de fitxer
- [ ] Gestió de quotes i pagaments
- [ ] Notificacions push
- [ ] Informes personalitzats
- [ ] Gestió de rols d'usuari

### 15.2 Millores Tècniques

- [ ] Migrar a Next.js 15
- [ ] Afegir tests unitaris (Jest/Vitest)
- [ ] Afegir tests E2E (Playwright)
- [ ] Implementar cache (Redis)
- [ ] Logging estructurat (winston/pino)
- [ ] Monitoring (Sentry)

---

*Document generat automàticament a partir del codi font de l'aplicació.*

