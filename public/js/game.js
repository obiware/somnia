import {calcProgress, lerp, PerspectiveEngine, Point} from './utils.js';
import { Star, StarCollection, Constellation, Player, Coin, CoinGenerator, CoinCollection} from './elements.js';

 var GameState = {
    background_color: [0, 0, 0],
    current_coin_speed:0,
    current_coin_interval_ticks:0,
    star_collection: null,
    constellation: null,
    player: null,
    coin_collection: null,
}


export class Game {
    constructor(config, canvas_ctx, soundMachine) {
        this.config = config;
        this.ctx = canvas_ctx;
        this.soundMachine = soundMachine;
        this.perspectiveEngine = new PerspectiveEngine(
            {x: 0.5, y: 0.50}, // origin
            {x: 0.1, y: 0},     // top left
            {x: 0.9, y: 0},     // top right
            {x: 0, y: 0.90},     // bottom left
            {x: 1, y: 0.90}      // bottom right
        );
        this.initState();

    }

    run(tick) {
        this.runState(tick);
        this.displayState();
    }

    runState(tick) {
        this.runProgress(tick);
        //this.tempAddRandomStarToConstellation(tick);
        this.runConstellation(tick);
        this.runPlayer(tick);
        this.runCoins(tick);
        this.checkCollisions();
    }

    displayState(){
        this.ctx.reset();
        
        this.displayBackground();
        this.displayStars();
        this.displayConstellation();

        this.perspectiveEngine.drawPerspectives(this.ctx);
        this.displayCoins();
        this.displayPlayer();
    }

    initState() {
        this.state = GameState;
        this.state.background_color = [...this.config.BG_START_COLOR];
        this.state.star_collection = new StarCollection(
            this.config.NB_STARS, 
            this.config.STARS_X_MAX_SPACE,
            this.config.STARS_Y_MAX_SPACE,
            this.perspectiveEngine);
        this.state.constellation = new Constellation(this.config.CONSTELLATION_MAX_LIFETIME_TICKS, this.config.CONSTELLATION_PATH_DURATION_TICKS);
        
        const positionPlayer = new Point(this.config.PLAYER_X_SLOTS[1], this.config.PLAYER_Y_POSITION);
        this.state.player = new Player(positionPlayer, this.config.PLAYER_X_SLOTS, this.config.PLAYER_RADIUS);
        this.state.player.setListeners(this.ctx.canvas);
        
        //Generate four Point from the four COIN_SLOTS using PLAYER_Y_POSITION as y coordinate
        const coinTargets = this.config.COIN_SLOTS.map(x => new Point(x, this.config.PLAYER_Y_POSITION));

        this.current_coin_speed = this.config.COIN_SPEED;
        this.current_coin_interval_ticks = this.config.COIN_INTERVAL_TICKS;

        const coinGenerator = new CoinGenerator(
            this.perspectiveEngine.origin,
            coinTargets,
            this.config.COIN_RADIUS, 
            this.current_coin_speed, 
            this.current_coin_interval_ticks);
        this.state.coin_collection = new CoinCollection(coinGenerator, this.current_coin_interval_ticks);
    
       
    }

    runProgress(tick) {
        if (tick > this.config.MAX_TICK) { return; }

        let progress = calcProgress(tick, this.config.MAX_TICK);
        
        this.soundMachine.setProgress(progress);

        this.state.background_color[0] = Math.trunc(lerp(this.config.BG_START_COLOR[0], this.config.BG_END_COLOR[0], progress));
        this.state.background_color[1] = Math.trunc(lerp(this.config.BG_START_COLOR[1], this.config.BG_END_COLOR[1], progress));
        this.state.background_color[2] = Math.trunc(lerp(this.config.BG_START_COLOR[2], this.config.BG_END_COLOR[2], progress));
        
        let result_lerp = lerp(this.config.COIN_SPEED, 
            this.config.FINAL_COIN_SPEED, 
            progress);
        
        
        this.current_coin_speed = lerp(this.config.COIN_SPEED, this.config.FINAL_COIN_SPEED, progress);
        this.current_coin_interval_ticks = lerp(this.config.COIN_INTERVAL_TICKS, this.config.FINAL_COIN_INTERVAL_TICKS, progress);
        

        
        this.state.coin_collection.coinGenerator.speed = this.current_coin_speed;
        this.state.coin_collection.coin_interval_ticks = this.current_coin_interval_ticks;

    }

    displayBackground() {
        const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.ctx.canvas.height);

        const r = this.state.background_color[0];
        const g = this.state.background_color[1];
        const b = this.state.background_color[2];

        skyGrad.addColorStop(1,   `rgb(${Math.min(255, r + 36)},${Math.min(255, g + 48)},${Math.min(255, b + 60)})`);
        skyGrad.addColorStop(0.5, `rgb(${r},${g},${b})`);
        skyGrad.addColorStop(0,   `rgb(${Math.max(0, r - 6)},${Math.max(0, g - 8)},${Math.max(0, b - 12)})`);

        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    displayStars() {
        this.state.star_collection.drawStars(this.ctx);
    }

    runConstellation(tick) {
        this.state.constellation.run(tick);
    }

    displayConstellation() {
        this.state.constellation.draw(this.ctx);
    }

    AddRandomStarToConstellation() {
        
        const randomStar = this.state.star_collection.getRandomStar();
        
        if (randomStar) {
            this.state.constellation.addStar(randomStar);
        }

        // If it was the first start, we quickly add a second to draw the first path
        if (this.state.constellation.connections.length == 1) {
            const randomStar = this.state.star_collection.getRandomStar();
            if (randomStar) {
                this.state.constellation.addStar(randomStar);
            }
        }
       
    }

    displayPlayer() {
        this.state.player.draw(this.ctx);
    }

    runPlayer(tick) {
        this.state.player.run();
    }

    displayCoins() {
        this.state.coin_collection.draw(this.ctx);
    }

    runCoins(tick) {
        this.state.coin_collection.run();
        
    }

    checkCollisions() {
        const player = this.state.player;
        const coins = this.state.coin_collection.coins;
        
        for (let i = 0; i < coins.length; i++) {
            if (this.isColliding(player, coins[i])) {
                coins[i].is_captured = true;
                this.AddRandomStarToConstellation();
                player.setSuccess(this.config.PLAYER_LIFETIME_SUCCESS_TICKS);
                let direction = coins[i].current_position.x < 0.5 ? 0 : 1;
                
                this.soundMachine.ringBell(direction);
            }
        }
    }

    isColliding(player, coin) {
        if (coin.is_captured) {
            return false;
        }
        const dx = player.position.x - coin.current_position.x; // noramlized coordinates
        const dy = player.position.y - coin.current_position.y;
        const distance = Math.sqrt(dx * dx + dy * dy); // normalized distance
        const combinedRadius = (player.radius + coin.radius) / (this.ctx.canvas.width*2.5);
        return distance < combinedRadius;
    }

    
}

export class SoundMachine {
    constructor(files) {
        this.ctx = null;
        this.isEnabled = false;

        this.background_sound_file = files.RAIN;
        this.bell_sound_file = files.BELL;
        
        // Fichiers audio stockés sous forme de AudioBuffers après chargement
        this.buffers = {
            rain: null,
            bell: null
        };

        // Références aux sources actives pour pouvoir les manipuler
        this.rainSource = null;
        this.rainCrossfadeGain = null; // Nœud crossfade : géré uniquement par _startRainLoop
        this.rainProgressGain = null;  // Nœud volume : géré uniquement par setProgress

        // Réglages de base
        this.baseVolume = 0.05; // Volume max général (divisé par 3 pour ne pas saturer)
        this.bellMaxVolume = 0.05; // Volume max pour la cloche tibétaine
        this.currentProgress = 0;
    }

    // 1. Initialisation et chargement des fichiers (à appeler au démarrage du jeu)
    async init() {
        // Le contexte audio ne peut être créé qu'après un clic utilisateur (sécurité navigateur)
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Chargement en parallèle des deux fichiers
        await Promise.all([
            this._loadSound('rain', this.background_sound_file),
            this._loadSound('bell', this.bell_sound_file)
        ]);

        // iOS suspend l'AudioContext agressivement (verrouillage écran, Low Power Mode)
        // Ce listener le reprend automatiquement quand l'app revient au premier plan
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.isEnabled && this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        });
    }

    async _loadSound(key, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            this.buffers[key] = await this.ctx.decodeAudioData(arrayBuffer);
        } catch (e) {
            console.error(`Impossible de charger le son : ${url}`, e);
        }
    }

    // 2. Activer / Désactiver le son via l'interface
    async setEnableSound(enabled) {
        this.isEnabled = enabled;

        // Sécurité au cas où init() n'a pas été appelé ou si le contexte est suspendu
        if (!this.ctx) return;
        // Sur iOS, resume() est asynchrone — il faut l'attendre avant de jouer du son
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }

        if (this.isEnabled) {
            // Créer le nœud de volume global (progress) une seule fois, il persiste
            if (!this.rainProgressGain) {
                this.rainProgressGain = this.ctx.createGain();
                this.rainProgressGain.connect(this.ctx.destination);
            }
            // Fade-in à l'activation : part de 0 et monte sur 1.5 secondes
            const targetVolume = this._calculateVolume() * this.baseVolume;
            this.rainProgressGain.gain.setValueAtTime(0, this.ctx.currentTime);
            this.rainProgressGain.gain.linearRampToValueAtTime(targetVolume, this.ctx.currentTime + 1.5);
            this._startRainLoop();
        } else {
            this._stopRainLoop();
        }
    }

    // 3. Gestion de la boucle de pluie avec fondu croisé automatique (Crossfade)
    _startRainLoop() {
        if (!this.isEnabled || !this.buffers.rain || !this.rainProgressGain) return;

        const buffer = this.buffers.rain;
        const duration = buffer.duration;

        const source = this.ctx.createBufferSource();
        const gainCrossfade = this.ctx.createGain();

        source.buffer = buffer;

        // Ce nœud gère uniquement le crossfade : 0 → 1 → 0 (valeurs normalisées)
        // Il ne connaît pas le volume réel — c'est gainProgress qui s'en charge
        const overlapTime = 4.0;
        const currentTime = this.ctx.currentTime;

        gainCrossfade.gain.setValueAtTime(0, currentTime);
        gainCrossfade.gain.linearRampToValueAtTime(1, currentTime + overlapTime);

        // Chaîne : source → gainCrossfade → rainProgressGain → destination
        source.connect(gainCrossfade);
        gainCrossfade.connect(this.rainProgressGain);
        source.start(0);

        this.rainSource = source;
        this.rainCrossfadeGain = gainCrossfade;

        const timeUntilNextLoop = duration - overlapTime;

        // Fade-out planifié sur le nœud crossfade uniquement
        gainCrossfade.gain.setValueAtTime(1, currentTime + timeUntilNextLoop);
        gainCrossfade.gain.linearRampToValueAtTime(0, currentTime + duration);

        source.onended = () => {
            source.disconnect();
            gainCrossfade.disconnect();
        };

        if (this.rainTimeout) clearTimeout(this.rainTimeout);
        this.rainTimeout = setTimeout(() => {
            if (this.isEnabled) this._startRainLoop();
        }, timeUntilNextLoop * 1000);
    }

    _stopRainLoop() {
        if (this.rainTimeout) clearTimeout(this.rainTimeout);

        if (this.rainProgressGain) {
            // Fade-out sur le nœud de volume global pour un arrêt propre
            this.rainProgressGain.gain.setValueAtTime(this.rainProgressGain.gain.value, this.ctx.currentTime);
            this.rainProgressGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);

            setTimeout(() => {
                if (this.rainSource) {
                    try { this.rainSource.stop(); } catch(e){}
                    this.rainSource = null;
                }
            }, 500);
        }
    }

    // 4. Déclenchement de la cloche tibétaine spatialisée
    ringBell(direction) {
        if (!this.isEnabled || !this.buffers.bell) return;

        const p = this.currentProgress; // [0, 1]

        const source = this.ctx.createBufferSource();
        const gainNode = this.ctx.createGain();
        const lowPassFilter = this.ctx.createBiquadFilter();

        source.buffer = this.buffers.bell;

        // Volume : baisse de 100% à 30% avec le progress (via _calculateVolume)
        const bellVolume = this._calculateVolume() * this.bellMaxVolume;
        gainNode.gain.setValueAtTime(bellVolume, this.ctx.currentTime);

        // Pitch : de 1.0 (progress=0) à 0.72 (progress=1) — effet "plus grave"
        source.playbackRate.value = 1.0 - (p * 0.28);

        // Filtre passe-bas : fréquence de coupure de 8000Hz à 1200Hz — effet "étouffé / éloigné"
        lowPassFilter.type = 'lowpass';
        lowPassFilter.frequency.value = 8000 - (p * 6800);

        // Panning : StereoPannerNode non supporté sur iOS < 14.1 → fallback PannerNode 3D
        const panValue = direction === 0 ? -1 : 1;
        let pannerNode;
        if (this.ctx.createStereoPanner) {
            pannerNode = this.ctx.createStereoPanner();
            pannerNode.pan.setValueAtTime(panValue, this.ctx.currentTime);
        } else {
            pannerNode = this.ctx.createPanner();
            pannerNode.panningModel = 'equalpower';
            pannerNode.setPosition(panValue, 0, 1 - Math.abs(panValue));
        }

        // Chaîne : source → panner → lowpass → gain → destination
        source.connect(pannerNode);
        pannerNode.connect(lowPassFilter);
        lowPassFilter.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        source.start(0);
    }

    // 5. Gestion dynamique de l'éloignement (Progress)
    setProgress(progress) {
        this.currentProgress = Math.max(0, Math.min(1, progress));

        // On adapte uniquement le nœud de volume global, sans toucher au crossfade
        if (this.isEnabled && this.rainProgressGain) {
            const newVolume = this._calculateVolume() * this.baseVolume;
            const gain = this.rainProgressGain.gain;
            const now = this.ctx.currentTime;
            // cancelAndHoldAtTime non supporté sur iOS < 14.5 — fallback manuel
            if (gain.cancelAndHoldAtTime) {
                gain.cancelAndHoldAtTime(now);
            } else {
                const currentValue = gain.value;
                gain.cancelScheduledValues(now);
                gain.setValueAtTime(currentValue, now);
            }
            gain.linearRampToValueAtTime(newVolume, now + 0.2);
        }
    }

    // Calcule le multiplicateur de volume — courbe exponentielle perceptuellement linéaire
    // 0^p = 1.0 (progress=0) → 0.3 (progress=1), baisse régulière en dB tout au long
    _calculateVolume() {
        return Math.pow(0.3, this.currentProgress);
    }
}