Voici la fiche descriptive et technique complète, rédigée spécifiquement pour être lue et exécutée par un agent de codage IA ou un développeur. Tu as juste à copier-coller le texte ci-dessous.

---

# Spécifications Techniques et Design : Projet "Somnia" (Jeu de Relaxation et d'Endormissement)

## Prompt d'introduction pour l'Agent de Codage

> "Tu es un développeur expert en Creative Coding, HTML5 Canvas et Web Audio API. Tu dois coder un jeu mobile web (page statique unique) conçu pour stopper les crises d'angoisse et amener l'utilisateur vers un endormissement profond. L'expérience doit être fluide (60 FPS), ultra-optimisée pour mobile, et ne nécessite aucun serveur (Full Client-Side). Suis scrupuleusement les spécifications physiques, visuelles et auditives ci-dessous."

---

## 1. Objectifs Majeurs & Neurosciences

Le jeu repose sur quatre piliers neuroscientifiques :

* **Anxiolyse par stimulation bilatérale alternée (Effet EMDR) :** Le balayage oculaire de gauche à droite désactive l'amygdale cérébrale (centre de la peur).
* **Dopamine d'accomplissement (Basse intensité) :** Récompenser la complétion (passer une porte) sans aucune punition en cas d'échec (zéro cortisol/stress).
* **Entraînement des ondes cérébrales (Brainwave Entrainment) :** Ralentissement progressif du rythme pour faire passer le cerveau des ondes Bêta (alerte) aux ondes Alpha (relaxation) puis Thêta (sommeil).
* **Ancrage cognitif synesthésique :** Association d'un signal Visuel + Auditif + Haptique synchrone pour saturer la mémoire de travail et bloquer les pensées anxieuses au début.

---

## 2. Architecture Technique

* **Format :** Fichier unique `index.html` (Logique JS incluse, ressources CSS/MP3 externes autorisées).
* **Rendu :** HTML5 `<canvas>` couvrant 100% de l'écran pour garantir la fluidité des animations.
* **Contrôles :** Événements `touchstart` / `touchmove` (Mobile First). Un objet central est déplacé horizontalement par glissement (drag).
* **Gestion du temps :** Un timer central gère une courbe de progression de 0 à 20 minutes (1200 secondes). À 20 minutes, les variables de transition se bloquent à leur valeur maximale (état de relaxation totale) et le jeu continue à l'infini sans jamais revenir à l'état initial.

---

## 3. Gameplay & Mécaniques de la Route

* **La Route Infinie :** Une route à défilement vertical vers le bas.
* **L'Objet :** Placé au centre vertical, déplaçable uniquement sur l'axe horizontal (X).
* **Les Portes :** Apparaissent en haut de l'écran et descendent vers l'objet. Leurs positions sur l'axe X varient aléatoirement selon des zones : *Extrême Gauche, Gauche, Centre-Gauche, Centre-Droit, Droite, Extrême Droite*.
* **Règle d'échec :** Si l'objet rate une porte, il ne se passe **rien** (pas de baisse de score, pas de flash rouge, pas de rupture de rythme).

---

## 4. Courbe d'Évolution sur 20 Minutes (Le "Cool-Down")

Toutes les transitions doivent être interpolées linéairement (`lerp`) sur une durée de 20 minutes (1200s). À $t \ge 1200s$, les valeurs restent fixes.

| Paramètre | Phase 1 (0 à 2 min) | Phase 2 (2 à 5 min) | Phase 3 (5 à 20 min) | Après 20 min (État Infini) |
| --- | --- | --- | --- | --- |
| **Vitesse de défilement** | Rapide (100%) | Moyenne (70%) | Lente (40%) | Ultra-lente et stable (35%) |
| **Écartement des portes** | Extrêmes (Max X) | Modérés (Milieu X) | Centrés (Proches de l'axe) | Quasi-alignés au centre |
| **Fréquence des portes** | Élevée (Toutes les 2s) | Moyenne (Toutes les 4s) | Faible (Toutes les 6s) | Très faible (Toutes les 8s) |
| **Couleurs du fond** | Tons chauds / Crépuscule (Orangé/Violet) | Bleu Nuit profond | Bleu Nuit très sombre / Anthracite | Noir bleuté (Lumière bleue minimale) |

---

## 5. Système de Constellation (Gestion de la Dopamine)

Pour remplacer un compteur de pièces anxiogène, chaque porte franchie génère une étoile dans le ciel (arrière-plan du canvas).

* **Phase 1 (0-2 min) :** L'étoile apparaît instantanément au moment du franchissement avec un éclat net (point blanc/doré brillant). Un trait de lumière net relie cette étoile à la précédente (effet géométrique/EMDR).
* **Phase 2 (2-5 min) :** Les étoiles deviennent plus grosses mais diffuses (effet nébuleuse, flou CSS/Canvas). Les lignes de connexion deviennent de la poussière cosmique floue.
* **Phase 3 à l'infini (5-20 min+) :** L'étoile apparaît via un fondu (`fade-in`) très lent (1 à 2 secondes). Teinte bleu pâle ou violette à faible opacité.
* **Gestion de l'infini (Mémoire et Visuel) :** Pour éviter la surcharge de l'écran et du système, le ciel est divisé en "constellations" de 30 étoiles. Quand une constellation est finie, elle s'estompe lentement à 5% d'opacité pour devenir un fond galactique lointain, et le traçage recommence à zéro au premier plan.

---

## 6. Audio & Haptique (Web Audio API)

L'audio doit être généré au maximum via la **Web Audio API** pour permettre des modifications dynamiques en temps réel sans coupure.

### Le Fond Sonore (Pluie Cotonneuse)

* **Source :** Un bruit blanc/rose simulant la pluie (généré par script ou via un sample MP3 en boucle).
* **Évolution :** Connecter la source à un `BiquadFilterNode` de type `lowpass` (filtre passe-bas).
* **Comportement :** Au fil des 20 minutes, la fréquence de coupure du filtre diminue progressivement (de 2000Hz à 400Hz). Le son de la pluie passe d'un bruit clair et dynamique à un grondement sourd, lointain, chaud et enveloppant ("cotonneux").

### Les Portes (Cloches Tibétaines & Spatialisation EMDR)

* **Le Son :** Un son de cloche tibétaine ou de goutte d'eau pure avec une longue réverbération (Release long).
* **Spatialisation Stéréo (EMDR) :** Utiliser un `StereoPannerNode` ou un `PannerNode`. Si la porte est franchie à l'extrême gauche de l'écran, le son doit être joué à 100% dans l'oreille gauche. Si elle est à droite, dans l'oreille droite. Cela force la synchronisation cérébrale.
* **Évolution :** Plus le temps avance, plus la fréquence fondamentale du son de la cloche baisse (les sons deviennent plus graves et profonds).

### Le Retour Haptique (Vibrations Mobile)

* **Mécanisme :** Utilisation de `navigator.vibrate()`.
* **Évolution :** * *0-2 min :* Vibration courte et nette (`[40]`) à chaque porte pour l'ancrage.
* *2-5 min :* Vibration atténuée (`[20]`).
* *Après 5 min :* Désactivation totale des vibrations pour laisser place à l'endormissement corporel.



---

## 7. Logique du Code Attendue (Pseudo-code d'architecture)

```javascript
// Variables d'état globales
let timeElapsed = 0; // en secondes
const MAX_TRANSITION_TIME = 1200; // 20 minutes

function updateGameParam() {
    // Calcul du facteur de progression clampé entre 0 et 1
    let progress = Math.min(timeElapsed / MAX_TRANSITION_TIME, 1.0);
    
    // Application des lerps économiques pour le moteur de rendu
    currentSpeed = lerp(START_SPEED, MIN_SPEED, progress);
    currentFrequency = lerp(START_FREQ, MIN_FREQ, progress);
    
    // Mise à jour du filtre audio de la pluie
    let filterFreq = lerp(2000, 400, progress);
    audioFilter.frequency.setValueAtTime(filterFreq, audioCtx.currentTime);
}

// Boucle principale (RequestAnimationFrame)
function gameLoop() {
    timeElapsed += 1/60; // Approximatif si 60fps
    updateGameParam();
    drawBackgroundSky(); // Gère le fondu des couleurs et les constellations
    drawRoadAndGates();
    drawPlayerObject();
    requestAnimationFrame(gameLoop);
}

```