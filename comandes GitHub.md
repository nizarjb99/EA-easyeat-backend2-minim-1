# Comandes GitHub

## Descàrrega d'un Projecte
- `git clone https://github.com/manelcolominas/EA-React.git`
- `git pull origin main`  # Actualitzar amb l'última versió del projecte

## Treballar amb Versions i Etiquetes
- `git tag`  # Mostra totes les versions (tags) disponibles
- `git checkout tags/<nom_tag>`  # Canviar a una versió concreta

## Abans de Treballar en els Arxius
- `git pull origin main`  # Per a descarregar-te la última versió del projecte

## Actualitzar Arxius a GitHub
- `git add .`  # Afegir tots els fitxers al commit
- `git commit -m "Descripció breu dels canvis"`  # Pujar els fitxers actualitzats
- `git push origin main`
- `git tag v1.0`  # Afegir una versió al commit
- `git push origin v1.0`  # Pujar la versió a GitHub

## Crear un Repositori Nou
- `mkdir <nom_projecte>`
- `cd <nom_projecte>/`
- `git init`  # Inicia un nou repositori local (a l'ordinador)
- `rm -rf .git`  # ⚠️ Elimina el repositori Git localment, a l'ordinador (no els fitxers!)

## Primer Commit
Per fer el primer commit d'un nou repositori creat des de la pàgina web de GitHub:

- `git init`  # Inicia un nou repositori local (a l'ordinador)
- `git remote add origin https://github.com/manelcolominas/EA-React.git`
- `git branch -M main`
- `git add .`  # Afegir tots els fitxers al commit
- `git commit -m "First Commit"`
- `git push -u origin main`

## Vincular un Directori a un Repositori de GitHub
- `git init`
- `git remote add origin https://github.com/manelcolominas/EA-JS.git`
- `git remote add origin https://github.com/manelcolominas/EA-TS.git`

## Treballar amb Branques

### Crear una Branca Nova
- `git checkout develop`  # Canviar a la branca develop
- `git checkout -b nom_branca`  # Crea la nova branca
- `git push -u origin nom_branca`  # Puja-la a GitHub

### Merge
- `git switch develop`  # Ves a develop
- `git pull`  # Assegura’t que està actualitzada
- `git merge feature2`  # Fes el merge de feature2
- `git push`  # Puja els canvis

## Conceptes Bàsics
- `git hash` -> És per saber si el contingut d'un objecte ha canviat o no. Per això guardarem els hash al git per saber si un projecte ha canviat o no o si esteu treballant en un mateix projecte igual.
- `git commit`  # Així es com es diuen les versions a git
- `git status`  # Mostra l’estat dels arxius (nous, modificats, preparats per commit).
- `git add <filename>`  # Per afegir un cert arxiu
- `git commit -m "initial commit"`  # Primer commit
- `git log`  # Mostra l’historial de commits.
- `git push origin main`  # Per a carregar els commits al repositori de github
- `git pull origin main`  # Per a descarregar els arxius del repositori de github

## Altres Conceptes
- **Insights** -> Network graph
- **Merge** -> Juntar els canvis fets pel teu company i tu, unificar branques
- Git tindrà problemes quan treballem en el mateix arxiu

© Manel Colominas - Tots els drets reservats