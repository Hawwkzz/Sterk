# STERK LED - Application Mobile de Suivi de Production

Application mobile (PWA) pour le suivi des installations LED par les équipes de terrain.

## 📱 C'est une vraie app mobile !

L'application est une **PWA (Progressive Web App)** :
- ✅ S'installe sur iPhone et Android
- ✅ Icône sur l'écran d'accueil
- ✅ Fonctionne en plein écran (sans barre de navigateur)
- ✅ Fonctionne hors ligne (basique)
- ✅ Notifications push (à venir)

## 🚀 Déploiement rapide

### Prérequis
- Un compte [Supabase](https://supabase.com) (gratuit)
- Un compte [Vercel](https://vercel.com) (gratuit)
- (Optionnel) Un compte [Resend](https://resend.com) pour les emails
- (Optionnel) Un compte [Twilio](https://twilio.com) pour les SMS

---

## 📋 Étape 1: Configurer Supabase

### 1.1 Créer un projet Supabase

1. Aller sur [supabase.com](https://supabase.com) et créer un compte
2. Cliquer sur "New Project"
3. Choisir un nom (ex: `sterk-led`)
4. Choisir une région proche (ex: `West EU (Ireland)`)
5. Créer un mot de passe fort pour la base de données
6. Cliquer sur "Create new project"

### 1.2 Configurer la base de données

1. Dans le dashboard Supabase, aller dans **SQL Editor**
2. Cliquer sur "New query"
3. Copier-coller le contenu de `supabase/migrations/001_initial_schema.sql`
4. Cliquer sur "Run" (Ctrl+Enter)

### 1.3 Configurer le Storage

1. Aller dans **Storage**
2. Cliquer sur "New bucket"
3. Nom: `chantier-photos`
4. Cocher "Public bucket"
5. Cliquer sur "Create bucket"

6. Cliquer sur le bucket créé → **Policies**
7. Ajouter ces policies:

**Policy 1 - Upload (INSERT)**
```sql
CREATE POLICY "Allow uploads"
ON storage.objects FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'chantier-photos');
```

**Policy 2 - Lecture (SELECT)**
```sql
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chantier-photos');
```

### 1.4 Créer le premier utilisateur admin

1. Aller dans **Authentication** → **Users**
2. Cliquer sur "Add user" → "Create new user"
3. Email: votre email admin
4. Password: un mot de passe fort
5. Cliquer sur "Create user"

6. Aller dans **SQL Editor** et exécuter:
```sql
-- Créer l'équipe admin
INSERT INTO equipes (name, responsable) 
VALUES ('Administration', 'Admin STERK');

-- Mettre à jour le profil en admin
UPDATE profiles 
SET role = 'admin', 
    equipe_id = (SELECT id FROM equipes WHERE name = 'Administration')
WHERE email = 'VOTRE_EMAIL@example.com';
```

### 1.5 Créer les équipes

Dans **SQL Editor**, exécuter:
```sql
INSERT INTO equipes (name, responsable) VALUES 
('Équipe Alpha', 'Jean Dupont'),
('Équipe Beta', 'Marie Martin'),
('Équipe Gamma', 'Pierre Durant');
```

### 1.6 Créer les comptes équipe

Pour chaque équipe:
1. **Authentication** → **Users** → **Add user**
2. Créer l'utilisateur avec email/password
3. Dans **SQL Editor**:
```sql
UPDATE profiles 
SET role = 'equipe', 
    equipe_id = (SELECT id FROM equipes WHERE name = 'Équipe Alpha')
WHERE email = 'equipe-alpha@example.com';
```

### 1.7 Récupérer les clés API

1. Aller dans **Settings** → **API**
2. Noter:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOi...`

---

## 📋 Étape 2: Déployer sur Vercel

### 2.1 Préparer le code

1. Créer un repository GitHub avec ce code
2. Ou forker ce repository

### 2.2 Déployer sur Vercel

1. Aller sur [vercel.com](https://vercel.com)
2. Cliquer sur "Add New" → "Project"
3. Importer le repository GitHub
4. Dans **Environment Variables**, ajouter:

| Variable | Valeur |
|----------|--------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` |
| `VITE_APP_URL` | `https://votre-app.vercel.app` |

5. Cliquer sur "Deploy"

### 2.3 Générer les icônes PWA

**IMPORTANT** : Cette étape est nécessaire pour que l'app soit installable !

1. Ouvrir le fichier `tools/generate-icons.html` dans un navigateur
2. Cliquer sur "Télécharger toutes les icônes"
3. Placer les fichiers PNG téléchargés dans `public/icons/`
4. Redéployer sur Vercel

### 2.4 Mettre à jour l'URL dans Supabase

1. Retourner dans Supabase → **Authentication** → **URL Configuration**
2. Dans "Site URL", mettre l'URL Vercel: `https://votre-app.vercel.app`
3. Dans "Redirect URLs", ajouter: `https://votre-app.vercel.app/**`

---

## 📋 Étape 3: Configurer les notifications (Optionnel)

### 3.1 Configurer Resend (emails)

1. Créer un compte sur [resend.com](https://resend.com)
2. Aller dans **API Keys** → créer une clé
3. Aller dans **Domains** → ajouter et vérifier votre domaine

### 3.2 Configurer Twilio (SMS)

1. Créer un compte sur [twilio.com](https://twilio.com)
2. Récupérer:
   - Account SID
   - Auth Token
   - Phone Number

### 3.3 Déployer l'Edge Function

1. Installer Supabase CLI:
```bash
npm install -g supabase
```

2. Se connecter:
```bash
supabase login
```

3. Lier le projet:
```bash
supabase link --project-ref VOTRE_PROJECT_REF
```

4. Configurer les secrets:
```bash
supabase secrets set RESEND_API_KEY=re_xxxxx
supabase secrets set EMAIL_FROM="STERK LED <noreply@votredomaine.com>"
supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxx
supabase secrets set TWILIO_AUTH_TOKEN=xxxxx
supabase secrets set TWILIO_PHONE_NUMBER=+33xxxxxxxxx
supabase secrets set APP_URL=https://votre-app.vercel.app
```

5. Déployer:
```bash
supabase functions deploy notify-client
```

---

## 🎉 C'est prêt !

### Installer l'app sur mobile

**Sur iPhone (Safari)** :
1. Ouvrir l'URL de l'app dans Safari
2. Appuyer sur le bouton Partager (carré avec flèche)
3. Choisir "Sur l'écran d'accueil"
4. Confirmer "Ajouter"

**Sur Android (Chrome)** :
1. Ouvrir l'URL de l'app dans Chrome
2. Une bannière "Installer" apparaît automatiquement
3. OU : Menu ⋮ → "Installer l'application"

### URLs importantes

- **Application**: `https://votre-app.vercel.app`
- **Dashboard Supabase**: `https://supabase.com/dashboard`
- **Validation client**: `https://votre-app.vercel.app/validation/{token}`

### Connexion

- Utiliser les emails/mots de passe créés dans Supabase Auth

---

## 🔧 Développement local

```bash
# Installer les dépendances
npm install

# Copier et configurer l'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés Supabase

# Lancer le serveur de développement
npm run dev
```

---

## 📁 Structure du projet

```
sterk-led-app/
├── src/
│   ├── components/       # Composants React
│   ├── contexts/         # Contextes (Auth)
│   ├── hooks/            # Hooks personnalisés
│   ├── lib/              # Utilitaires et config
│   ├── pages/            # Pages de l'application
│   ├── App.jsx           # Router principal
│   └── main.jsx          # Point d'entrée
├── supabase/
│   ├── functions/        # Edge Functions
│   └── migrations/       # Schema SQL
├── public/               # Assets statiques
└── ...config files
```

---

## 🆘 Support

En cas de problème:
1. Vérifier les logs dans Vercel (Deployments → Functions)
2. Vérifier les logs dans Supabase (Logs → Edge Functions)
3. Vérifier que toutes les variables d'environnement sont configurées

---

## 📝 Notes

- Le quota mensuel est de **1 600 LED** par équipe
- La prime est de **5€ par LED** au-dessus du quota
- Les liens de validation expirent après **72 heures**
- Les photos sont limitées à **5MB** chacune
