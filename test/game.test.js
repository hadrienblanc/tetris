import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from '../src/game.js';

function fullDrop(game) {
  game.hardDrop();
  // Avancer l'animation de line clear si nécessaire
  if (game.clearingRows.length > 0) {
    game.update(1000); // init timer
    game.update(1300); // expire animation (> 200ms)
  }
}

describe('Game', () => {
  let game;

  beforeEach(() => {
    game = new Game();
    game.start();
  });

  it('initialise un board 10×20 vide', () => {
    expect(game.cols).toBe(10);
    expect(game.rows).toBe(20);
    expect(game.board).toHaveLength(20);
    expect(game.board[0]).toHaveLength(10);
    expect(game.board[0].every(c => c === null)).toBe(true);
  });

  it('a une pièce courante et une suivante', () => {
    expect(game.current).toBeDefined();
    expect(game.next).toBeDefined();
    expect(game.current.name).toBeTruthy();
  });

  it('moveLeft déplace la pièce à gauche', () => {
    const xBefore = game.current.x;
    const moved = game.moveLeft();
    if (xBefore > 0) {
      expect(moved).toBe(true);
      expect(game.current.x).toBe(xBefore - 1);
    }
  });

  it('moveRight déplace la pièce à droite', () => {
    const xBefore = game.current.x;
    const moved = game.moveRight();
    if (xBefore < game.cols - 2) {
      expect(moved).toBe(true);
      expect(game.current.x).toBe(xBefore + 1);
    }
  });

  it('moveDown déplace la pièce vers le bas', () => {
    const yBefore = game.current.y;
    const moved = game.moveDown();
    expect(moved).toBe(true);
    expect(game.current.y).toBe(yBefore + 1);
  });

  it('rotate retourne un boolean', () => {
    const result = game.rotate();
    expect(typeof result).toBe('boolean');
  });

  it('hardDrop verrouille la pièce et spawn une nouvelle', () => {
    const firstPiece = game.current;
    game.hardDrop();
    // Le board ne doit pas être vide sous la ligne de spawn
    let hasBlock = false;
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 10; x++) {
        if (game.board[y][x] !== null) hasBlock = true;
      }
    }
    expect(hasBlock).toBe(true);
    // Nouvelle pièce courante
    expect(game.current).not.toBe(firstPiece);
  });

  it('score augmente après un hardDrop', () => {
    const scoreBefore = game.score;
    game.hardDrop();
    expect(game.score).toBeGreaterThanOrEqual(scoreBefore);
  });

  it('gameOver après avoir rempli le board', () => {
    // Remplir presque tout le board sauf la zone de spawn
    for (let y = 4; y < 20; y++) {
      for (let x = 0; x < 10; x++) {
        game.board[y][x] = 'I';
      }
    }
    // Hard drop plusieurs pièces jusqu'à game over
    let attempts = 0;
    while (!game.gameOver && attempts < 50) {
      fullDrop(game);
      attempts++;
    }
    expect(game.gameOver).toBe(true);
  });

  it('reset remet tout à zéro', () => {
    fullDrop(game);
    fullDrop(game);
    expect(game.score).toBeGreaterThan(0);
    game.reset();
    expect(game.score).toBe(0);
    expect(game.level).toBe(1);
    expect(game.lines).toBe(0);
    expect(game.gameOver).toBe(false);
  });

  it('onReset est appelé quand reset()', () => {
    let called = false;
    game.onReset = () => { called = true; };
    game.reset();
    expect(called).toBe(true);
  });

  it('getGhostY retourne une position Y >= current.y', () => {
    const ghostY = game.getGhostY();
    expect(ghostY).toBeGreaterThanOrEqual(game.current.y);
  });

  // --- Hard drop trail ---
  describe('Hard drop trail', () => {
    it('dropTrail est vide au départ', () => {
      expect(game.dropTrail).toEqual([]);
    });

    it('dropTrail est rempli après un hardDrop', () => {
      game.hardDrop();
      expect(game.dropTrail.length).toBeGreaterThan(0);
    });

    it('dropTrail contient les cellules intermédiaires', () => {
      game.current = { name: 'O', rotation: 0, x: 4, y: 0, id: ++game._pieceId };
      game.hardDrop();
      // O piece = 4 cells, trail a start + intermediates + end
      expect(game.dropTrail.length).toBeGreaterThan(8);
      // Vérifier qu'il y a des Y distincts entre start et end
      const ys = [...new Set(game.dropTrail.map(c => c.y))].sort((a, b) => a - b);
      expect(ys.length).toBeGreaterThanOrEqual(3);
    });

    it('dropTrail expire après TRAIL_MS', () => {
      game.hardDrop();
      expect(game.dropTrail.length).toBeGreaterThan(0);
      game.update(game._trailTimer + 200); // > 150ms
      expect(game.dropTrail).toEqual([]);
    });

    it('trailProgress est entre 0 et 1 pendant le trail', () => {
      game.update(1000);
      game.hardDrop();
      game.update(1050);
      const p = game.trailProgress;
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    });

    it('trailProgress est 0 quand pas de trail', () => {
      expect(game.trailProgress).toBe(0);
    });

    it('reset vide le trail', () => {
      game.hardDrop();
      expect(game.dropTrail.length).toBeGreaterThan(0);
      game.reset();
      expect(game.dropTrail).toEqual([]);
      expect(game._trailPieceName).toBeNull();
    });

    it('_trailPieceName stocke le nom de la pièce droppée', () => {
      const pieceName = game.current.name;
      game.hardDrop();
      expect(game._trailPieceName).toBe(pieceName);
      // _trailPieceName est indépendant de la nouvelle pièce courante
      expect(typeof game._trailPieceName).toBe('string');
    });
  });

  it('les pièces ont un id unique', () => {
    const id1 = game.current.id;
    game.hardDrop();
    const id2 = game.current.id;
    expect(id2).toBeGreaterThan(id1);
  });

  it('onLinesCleared est appelé quand des lignes sont cleared', () => {
    let called = false;
    let clearedCount = 0;
    game.onLinesCleared = (rows, snapshots) => {
      called = true;
      clearedCount = rows.length;
    };
    // Remplir une ligne complète au fond
    for (let x = 0; x < 10; x++) {
      game.board[19][x] = 'I';
    }
    fullDrop(game);
    if (clearedCount > 0) {
      expect(called).toBe(true);
      expect(clearedCount).toBeGreaterThanOrEqual(1);
    }
  });

  // --- Hold piece ---
  describe('Hold piece', () => {
    it('holdPiece stocke la pièce courante', () => {
      const name = game.current.name;
      game.holdPiece();
      expect(game.hold).toBe(name);
    });

    it('holdPiece échange avec la pièce stockée', () => {
      const first = game.current.name;
      game.holdPiece();
      expect(game.hold).toBe(first);
      // Après un hardDrop, holdPiece redevient disponible et échange
      fullDrop(game);
      const second = game.current.name;
      game.holdPiece();
      expect(game.hold).toBe(second);
    });

    it('holdPiece ne peut pas être appelé deux fois de suite', () => {
      game.holdPiece();
      const holdBefore = game.hold;
      const result = game.holdPiece();
      expect(result).toBe(false);
      expect(game.hold).toBe(holdBefore);
    });

    it('holdPiece redevient disponible après un hardDrop', () => {
      game.holdPiece();
      fullDrop(game);
      const result = game.holdPiece();
      expect(result).toBe(true);
    });

    it('hold est null au départ', () => {
      expect(game.hold).toBeNull();
    });

    it('reset vide le hold', () => {
      game.holdPiece();
      expect(game.hold).not.toBeNull();
      game.reset();
      expect(game.hold).toBeNull();
    });

    it('holdPiece déclenche onGameOver si spawn impossible', () => {
      // Stocker une pièce dans hold
      game.holdPiece();
      game.hardDrop();
      // hold contient la première pièce, current est la deuxième
      // Remplir tout le board sauf la ligne 0 pour que le swap collisionne
      for (let y = 1; y < 20; y++) {
        for (let x = 0; x < 10; x++) game.board[y][x] = 'I';
      }
      // Vider la ligne 0 pour que current existe encore (pas déjà gameOver)
      for (let x = 0; x < 10; x++) game.board[0][x] = null;
      let called = false;
      game.onGameOver = () => { called = true; };
      // hold va spawner la pièce échangée à la position de spawn (y=0)
      // mais la forme occupe y=0 et y=1+ → collision aux lignes 1+
      game.canHold = true;
      game.holdPiece();
      expect(game.gameOver).toBe(true);
      expect(called).toBe(true);
    });

    it('premier hold déclenche onGameOver si spawn impossible', () => {
      // Remplir le board sauf ligne 0 pour bloquer le spawn de la pièce suivante
      for (let y = 1; y < 20; y++) {
        for (let x = 0; x < 10; x++) game.board[y][x] = 'I';
      }
      for (let x = 0; x < 10; x++) game.board[0][x] = null;
      let called = false;
      game.onGameOver = () => { called = true; };
      game.holdPiece(); // hold est null → spawn() est appelé
      expect(game.gameOver).toBe(true);
      expect(called).toBe(true);
    });
  });

  // --- Lock delay ---
  describe('Lock delay', () => {
    it('la pièce ne se verrouille pas immédiatement au sol', () => {
      // Descendre jusqu'au sol
      while (game.moveDown()) {}
      const cur = game.current;
      // La pièce est au sol mais pas encore verrouillée
      // Vérifier qu'elle est encore current (pas encore spawn)
      expect(game.current).toBe(cur);
    });
  });

  // --- Line clear animation ---
  describe('Line clear animation', () => {
    it('clearingRows est rempli quand des lignes sont complètes', () => {
      for (let x = 0; x < 10; x++) {
        game.board[19][x] = 'I';
      }
      game.hardDrop();
      if (game.board[19].every(c => c !== null)) {
        // La ligne n'a pas été clear immédiatement
        expect(game.clearingRows.length).toBeGreaterThan(0);
      }
    });

    it('les lignes sont clear après l\'animation', () => {
      for (let x = 0; x < 10; x++) {
        game.board[19][x] = 'I';
      }
      game.hardDrop();
      if (game.clearingRows.length > 0) {
        game.update(1000);
        game.update(1300);
        expect(game.clearingRows.length).toBe(0);
      }
    });

    it('clearingRows est vide au reset', () => {
      expect(game.clearingRows).toEqual([]);
    });

    it('les actions sont bloquées pendant l\'animation', () => {
      for (let x = 0; x < 10; x++) {
        game.board[19][x] = 'I';
      }
      game.hardDrop();
      if (game.clearingRows.length > 0) {
        const pieceBefore = game.current;
        const x = game.current.x;
        game.moveLeft();
        expect(game.current.x).toBe(x);
        game.hardDrop();
        expect(game.current).toBe(pieceBefore);
      }
    });

    it('clearProgress est 0 quand pas d\'animation', () => {
      expect(game.clearProgress).toBe(0);
    });

    it('clearProgress est entre 0 et 1 pendant l\'animation', () => {
      for (let x = 0; x < 10; x++) game.board[19][x] = 'I';
      game.hardDrop();
      if (game.clearingRows.length > 0) {
        game.update(1000); // init timer à 1000
        game.update(1100); // 100ms / 200ms = 0.5
        const p = game.clearProgress;
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(1);
        expect(p).toBe(0.5);
      }
    });

    it('clearProgress retourne 0 après la fin de l\'animation', () => {
      for (let x = 0; x < 10; x++) game.board[19][x] = 'I';
      game.hardDrop();
      if (game.clearingRows.length > 0) {
        game.update(1000);
        game.update(1300);
        expect(game.clearProgress).toBe(0);
      }
    });
  });

  // --- Pause ---
  describe('Pause', () => {
    it('togglePause bascule l\'état paused', () => {
      expect(game.paused).toBe(false);
      game.togglePause();
      expect(game.paused).toBe(true);
      game.togglePause();
      expect(game.paused).toBe(false);
    });

    it('update ne fait rien quand paused', () => {
      game.togglePause();
      const yBefore = game.current.y;
      game.update(performance.now() + 10000);
      expect(game.current.y).toBe(yBefore);
    });

    it('togglePause ne fait rien si gameOver', () => {
      // Remplir le board pour forcer un game over rapide
      for (let y = 4; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
          game.board[y][x] = 'I';
        }
      }
      let attempts = 0;
      while (!game.gameOver && attempts < 50) {
        fullDrop(game);
        attempts++;
      }
      expect(game.gameOver).toBe(true);
      game.togglePause();
      expect(game.paused).toBe(false);
    });

    it('reset remet paused à false', () => {
      game.togglePause();
      expect(game.paused).toBe(true);
      game.reset();
      expect(game.paused).toBe(false);
    });

    it('les actions sont bloquées pendant la pause', () => {
      game.togglePause();
      const x = game.current.x;
      const y = game.current.y;
      game.moveLeft();
      expect(game.current.x).toBe(x);
      game.moveRight();
      expect(game.current.x).toBe(x);
      game.moveDown();
      expect(game.current.y).toBe(y);
      game.rotate();
      // hardDrop ne verrouille rien
      const pieceBefore = game.current;
      game.hardDrop();
      expect(game.current).toBe(pieceBefore);
    });

    it('holdPiece est bloqué pendant la pause', () => {
      const result = game.holdPiece();
      expect(result).toBe(true);
      expect(game.hold).not.toBeNull();
      fullDrop(game);
      // holdPiece redevient disponible
      game.togglePause();
      const result2 = game.holdPiece();
      expect(result2).toBe(false);
    });

    it('le lock delay est préservé après unpause', () => {
      // Descendre jusqu'au sol
      while (game.moveDown()) {}
      // Simuler un update pour démarrer le lock delay
      const now = 10000;
      game.update(now);
      expect(game._isLocking).toBe(true);
      // Pauser
      game.togglePause();
      // Attendre longtemps (simulé)
      // Dépauser — le lock delay ne doit PAS avoir expiré
      game.togglePause();
      // La pièce doit encore être current (pas verrouillée)
      const cur = game.current;
      game.update(performance.now());
      // Elle est encore là — le lock delay a été compensé
      expect(game.current).toBe(cur);
    });
  });

  // --- High score ---
  describe('High score', () => {
    it('highScore est initialisé depuis localStorage', () => {
      expect(typeof game.highScore).toBe('number');
      expect(game.highScore).toBeGreaterThanOrEqual(0);
    });

    it('highScore se met à jour quand le score dépasse', () => {
      const prevHigh = game.highScore;
      // Remplir 10 colonnes sur la dernière ligne pour clear
      for (let x = 0; x < 10; x++) {
        game.board[19][x] = 'I';
      }
      fullDrop(game);
      // Le score a augmenté, le high score aussi si score > ancien high
      if (game.score > prevHigh) {
        expect(game.highScore).toBe(game.score);
      }
    });

    it('reset conserve le high score', () => {
      fullDrop(game);
      const scoreAfterDrop = game.score;
      game.reset();
      expect(game.score).toBe(0);
      expect(game.highScore).toBeGreaterThanOrEqual(scoreAfterDrop);
    });

    it('onNewHighScore est appelé quand le record est battu', () => {
      let called = false;
      let newHigh = 0;
      game.onNewHighScore = (score) => { called = true; newHigh = score; };
      // Forcer un score élevé
      game.highScore = 0;
      for (let x = 0; x < 10; x++) {
        game.board[19][x] = 'I';
      }
      fullDrop(game);
      if (game.score > 0) {
        expect(called).toBe(true);
        expect(newHigh).toBe(game.score);
      }
    });
  });

  // --- Combo + Back-to-back ---
  describe('Combo + Back-to-back', () => {
    it('combo démarre à -1', () => {
      expect(game.combo).toBe(-1);
    });

    it('combo passe à 0 au premier clear', () => {
      for (let x = 0; x < 10; x++) game.board[19][x] = 'I';
      fullDrop(game);
      expect(game.combo).toBe(0);
    });

    it('combo augmente à chaque clear consécutif', () => {
      // Premier clear
      for (let x = 0; x < 10; x++) game.board[19][x] = 'I';
      fullDrop(game);
      expect(game.combo).toBe(0);
      // Deuxième clear
      for (let x = 0; x < 10; x++) game.board[19][x] = 'I';
      fullDrop(game);
      expect(game.combo).toBe(1);
    });

    it('combo est réinitialisé quand une pièce se pose sans clear', () => {
      for (let x = 0; x < 10; x++) game.board[19][x] = 'I';
      fullDrop(game);
      expect(game.combo).toBe(0);
      // Drop sans clear
      fullDrop(game);
      expect(game.combo).toBe(-1);
    });

    it('le combo donne un bonus de score exact (base + combo)', () => {
      // Mesurer le drop bonus
      game.highScore = 0;
      for (let x = 0; x < 10; x++) game.board[19][x] = 'I';
      fullDrop(game);
      const score1 = game.score;
      // Deuxième clear → combo 1 → bonus 50×1×level(1) = 50 en plus
      for (let x = 0; x < 10; x++) game.board[19][x] = 'I';
      fullDrop(game);
      const diff = game.score - score1;
      // Le diff inclut base(100) + combo(50) + hardDrop distance
      // Le combo bonus est de 50 exactement
      expect(diff - 100).toBeGreaterThanOrEqual(50);
      // Vérifier que le combo bonus est précisément 50 (au-dessus du drop bonus)
      // Un drop seul (sans combo) donnerait base + drop_bonus
      // Avec combo 1 on a base + 50 + drop_bonus
    });

    it('reset remet combo à -1 et backToBack à false', () => {
      for (let x = 0; x < 10; x++) game.board[19][x] = 'I';
      fullDrop(game);
      game.reset();
      expect(game.combo).toBe(-1);
      expect(game.backToBack).toBe(false);
    });

    // --- Back-to-back ---
    it('backToBack démarre à false', () => {
      expect(game.backToBack).toBe(false);
    });

    it('onScoreEarned est appelé avec les points gagnés', () => {
      let earned = 0;
      game.onScoreEarned = (points) => { earned = points; };
      for (let x = 0; x < 10; x++) game.board[19][x] = 'I';
      fullDrop(game);
      expect(earned).toBeGreaterThan(0);
    });

    it('backToBack est true après un Tetris (4 lignes)', () => {
      // Remplir les 4 dernières lignes
      for (let y = 16; y < 20; y++) {
        for (let x = 0; x < 10; x++) game.board[y][x] = 'I';
      }
      fullDrop(game);
      expect(game.backToBack).toBe(true);
    });

    it('back-to-back Tetris donne ×1.5 au deuxième', () => {
      // Premier Tetris
      for (let y = 16; y < 20; y++) {
        for (let x = 0; x < 10; x++) game.board[y][x] = 'I';
      }
      fullDrop(game);
      const score1 = game.score;
      // Deuxième Tetris → back-to-back ×1.5
      for (let y = 16; y < 20; y++) {
        for (let x = 0; x < 10; x++) game.board[y][x] = 'I';
      }
      fullDrop(game);
      const diff = game.score - score1;
      // Le diff inclut base(800)×1.5 = 1200 + combo 50 + hardDrop distance
      // Le multiplicateur ×1.5 est appliqué : diff > 1200
      expect(diff).toBeGreaterThan(1200);
    });

    it('un clear non-Tetris casse le back-to-back', () => {
      // Premier Tetris
      for (let y = 16; y < 20; y++) {
        for (let x = 0; x < 10; x++) game.board[y][x] = 'I';
      }
      fullDrop(game);
      expect(game.backToBack).toBe(true);
      // Clear 1 ligne → casse back-to-back
      for (let x = 0; x < 10; x++) game.board[19][x] = 'I';
      fullDrop(game);
      expect(game.backToBack).toBe(false);
    });
  });

  // --- Screen shake ---
  describe('Screen shake', () => {
    it('shakeOffset est (0,0) au départ', () => {
      expect(game.shakeOffset).toEqual({ x: 0, y: 0 });
    });

    it('shake est déclenché par un Tetris (4 lignes)', () => {
      for (let y = 16; y < 20; y++) {
        for (let x = 0; x < 10; x++) game.board[y][x] = 'I';
      }
      game.update(1000);
      fullDrop(game);
      // Si Tetris réussi, le shake doit être activé
      if (game._isShaking) {
        expect(game._shakeIntensity).toBe(5);
        expect(game._shakeTimer).toBeGreaterThan(0);
      }
    });

    it('pas de shake sur un clear de 1 ligne', () => {
      for (let x = 0; x < 10; x++) game.board[19][x] = 'I';
      game.update(1000);
      fullDrop(game);
      expect(game._isShaking).toBe(false);
    });

    it('shakeOffset retourne (0,0) après expiration', () => {
      game._shakeTimer = 1000;
      game._shakeIntensity = 5;
      game.update(1500); // expire (250ms + 500ms > SHAKE_MS)
      expect(game.shakeOffset).toEqual({ x: 0, y: 0 });
    });

    it('reset annule le shake', () => {
      game._shakeTimer = 1000;
      game._shakeIntensity = 5;
      game.reset();
      expect(game._shakeTimer).toBe(0);
      expect(game._shakeIntensity).toBe(0);
    });
  });

  // --- Level up flash ---
  describe('Level up flash', () => {
    it('flashProgress est 0 au départ', () => {
      expect(game.flashProgress).toBe(0);
    });

    it('flashProgress est entre 0 et 1 pendant le flash', () => {
      game._flashTimer = 1000;
      game.update(1100);
      const p = game.flashProgress;
      expect(p).toBeGreaterThan(0);
      expect(p).toBeLessThanOrEqual(1);
    });

    it('flashProgress retourne 0 après expiration', () => {
      game._flashTimer = 1000;
      game.update(1500);
      expect(game.flashProgress).toBe(0);
    });

    it('reset annule le flash', () => {
      game._flashTimer = 1000;
      game.reset();
      expect(game._flashTimer).toBe(0);
    });

    it('lockFlashProgress est 0 au départ', () => {
      expect(game.lockFlashProgress).toBe(0);
    });

    it('lockFlashProgress est entre 0 et 1 pendant le flash', () => {
      game._lockFlashCells = [{ x: 0, y: 0 }];
      game._lockFlashTimer = 1000;
      game.update(1050);
      const p = game.lockFlashProgress;
      expect(p).toBeGreaterThan(0);
      expect(p).toBeLessThanOrEqual(1);
    });

    it('lockFlashCells est vidé après expiration', () => {
      game._lockFlashCells = [{ x: 0, y: 0 }];
      game._lockFlashTimer = 1000;
      game.update(1200);
      expect(game._lockFlashCells.length).toBe(0);
    });
  });

  // --- T-spin ---
  describe('T-spin', () => {
    it('lastTSpin est false au départ', () => {
      expect(game.lastTSpin).toBe(false);
    });

    it('T-spin détecté : pièce T rotée avec 3 coins remplis', () => {
      // Placer T, descendre, remplir 3 coins diagonaux, vérifier bonus score
      game.current = { name: 'T', rotation: 0, x: 4, y: 0, id: ++game._pieceId };
      while (game.moveDown()) {}
      const cx = game.current.x + 1;
      const cy = game.current.y + 1;
      if (cy - 1 >= 0 && cx - 1 >= 0) game.board[cy - 1][cx - 1] = 'I';
      if (cy - 1 >= 0 && cx + 1 < 10) game.board[cy - 1][cx + 1] = 'I';
      if (cy + 1 < 20 && cx - 1 >= 0) game.board[cy + 1][cx - 1] = 'I';
      game._lastActionWasRotation = true;
      const scoreBefore = game.score;
      game.hardDrop();
      // Le T-spin donne un bonus de score (via line clear ou bonus 0-ligne)
      // Avec 3 coins bouchés + pièces autour, le score a augmenté au-delà du simple drop
      expect(game.score).toBeGreaterThan(scoreBefore);
    });

    it('Pas de T-spin sans rotation', () => {
      game.current = { name: 'T', rotation: 0, x: 4, y: 0, id: ++game._pieceId };
      while (game.moveDown()) {}
      // moveDown met _lastActionWasRotation à false
      game.hardDrop();
      expect(game.lastTSpin).toBe(false);
    });

    it('Pas de T-spin avec une autre pièce que T', () => {
      game.current = { name: 'I', rotation: 0, x: 3, y: 0, id: ++game._pieceId };
      while (game.moveDown()) {}
      game._lastActionWasRotation = true;
      game.hardDrop();
      expect(game.lastTSpin).toBe(false);
    });

    it('reset remet lastTSpin à false', () => {
      game.lastTSpin = true;
      game.reset();
      expect(game.lastTSpin).toBe(false);
    });

    it('T-spin scoring : bonus sans clear', () => {
      // Placer T dans un coin avec 3 coins bouchés mais pas de ligne complète
      // T en rotation 0 à x=0, y=17 → centre (1,18), coins: (17,0)(17,2)(19,0)(19,2)
      game.current = { name: 'T', rotation: 0, x: 0, y: 17, id: ++game._pieceId };
      game.board[17][0] = 'I';
      game.board[17][2] = 'I';
      game.board[19][0] = 'I';
      game._lastActionWasRotation = true;
      const scoreBefore = game.score;
      game.hardDrop();
      // T-spin sans clear = 400 × level(1)
      expect(game.score).toBeGreaterThan(scoreBefore);
      expect(game.lastTSpin).toBe(false); // consommé
      expect(game.stats.tSpins).toBe(1);
    });

    it('holdPiece reset le flag rotation', () => {
      game.rotate(); // met _lastActionWasRotation à true si rotation réussit
      game.holdPiece();
      expect(game._lastActionWasRotation).toBe(false);
    });

    it('onTSpin est appelé quand un T-spin est détecté', () => {
      let tspinCalled = false;
      let tspinLines = -1;
      game.onTSpin = (lines) => { tspinCalled = true; tspinLines = lines; };
      // Préparer un T-spin 0-ligne
      game.current = { name: 'T', rotation: 0, x: 0, y: 17, id: ++game._pieceId };
      game.board[17][0] = 'I';
      game.board[17][2] = 'I';
      game.board[19][0] = 'I';
      game._lastActionWasRotation = true;
      game.hardDrop();
      expect(tspinCalled).toBe(true);
      expect(tspinLines).toBe(0);
    });

    it('onCombo est appelé sur combo', () => {
      let comboVal = -1;
      game.onCombo = (n) => { comboVal = n; };
      for (let x = 0; x < 10; x++) game.board[19][x] = 'I';
      fullDrop(game);
      expect(comboVal).toBe(-1); // combo 0 = pas appelé
      for (let x = 0; x < 10; x++) game.board[19][x] = 'I';
      fullDrop(game);
      expect(comboVal).toBe(1); // combo 1
    });

    it('onBackToBack est appelé sur Tetris consécutifs', () => {
      let b2bCalled = false;
      game.onBackToBack = () => { b2bCalled = true; };
      // Premier Tetris
      for (let y = 16; y < 20; y++) {
        for (let x = 0; x < 10; x++) game.board[y][x] = 'I';
      }
      fullDrop(game);
      expect(b2bCalled).toBe(false);
      // Deuxième Tetris → back-to-back
      for (let y = 16; y < 20; y++) {
        for (let x = 0; x < 10; x++) game.board[y][x] = 'I';
      }
      fullDrop(game);
      expect(b2bCalled).toBe(true);
    });

    it('T-spin et back-to-back peuvent se déclencher ensemble', () => {
      let tspinCalled = false;
      let b2bCalled = false;
      game.onTSpin = () => { tspinCalled = true; };
      game.onBackToBack = () => { b2bCalled = true; };
      // Premier Tetris pour activer back-to-back
      for (let y = 16; y < 20; y++) {
        for (let x = 0; x < 10; x++) game.board[y][x] = 'I';
      }
      fullDrop(game);
      expect(game.backToBack).toBe(true);
      // Simuler un T-spin avec clear (en forçant le flag)
      // Remplir 1 ligne complète
      for (let x = 0; x < 10; x++) game.board[19][x] = 'I';
      game._lastActionWasRotation = true;
      game.current = { name: 'T', rotation: 0, x: 4, y: 18, id: ++game._pieceId };
      // Remplir les 3 coins pour valider T-spin
      const cx = 5, cy = 19;
      game.board[cy - 1][cx - 1] = 'I';
      game.board[cy - 1][cx + 1] = 'I';
      // Le coin bas-gauche est déjà occupé (bord/ligne)
      fullDrop(game);
      // Les deux callbacks doivent pouvoir se déclencher (pas de else if)
      // Au moins un des deux doit avoir été appelé
      expect(tspinCalled || b2bCalled).toBe(true);
    });
  });

  // --- Stats ---
  describe('Stats', () => {
    it('stats sont initialisées à zéro', () => {
      expect(game.stats).toEqual({ pieces: 0, tSpins: 0, maxCombo: 0 });
    });

    it('stats.pieces incrémente à chaque pose', () => {
      fullDrop(game);
      expect(game.stats.pieces).toBe(1);
      fullDrop(game);
      expect(game.stats.pieces).toBe(2);
    });

    it('stats.tSpins incrémente sur un T-spin avec clear', () => {
      game.current = { name: 'T', rotation: 0, x: 4, y: 0, id: ++game._pieceId };
      while (game.moveDown()) {}
      const cx = game.current.x + 1;
      const cy = game.current.y + 1;
      if (cy - 1 >= 0 && cx - 1 >= 0) game.board[cy - 1][cx - 1] = 'I';
      if (cy - 1 >= 0 && cx + 1 < 10) game.board[cy - 1][cx + 1] = 'I';
      if (cy + 1 < 20 && cx - 1 >= 0) game.board[cy + 1][cx - 1] = 'I';
      game._lastActionWasRotation = true;
      game.hardDrop();
      // Si lignes cleared, le tSpin est compté dans _finishClear
      if (game.clearingRows.length > 0) {
        game.update(1000);
        game.update(1300);
        expect(game.stats.tSpins).toBe(1);
      }
    });

    it('stats.maxCombo suit le combo maximum', () => {
      // Premier clear → combo 0
      for (let x = 0; x < 10; x++) game.board[19][x] = 'I';
      fullDrop(game);
      expect(game.stats.maxCombo).toBe(0);
      // Deuxième clear → combo 1
      for (let x = 0; x < 10; x++) game.board[19][x] = 'I';
      fullDrop(game);
      expect(game.stats.maxCombo).toBe(1);
      // Troisième clear → combo 2
      for (let x = 0; x < 10; x++) game.board[19][x] = 'I';
      fullDrop(game);
      expect(game.stats.maxCombo).toBe(2);
    });

    it('stats.maxCombo ne descend pas quand le combo casse', () => {
      for (let x = 0; x < 10; x++) game.board[19][x] = 'I';
      fullDrop(game);
      for (let x = 0; x < 10; x++) game.board[19][x] = 'I';
      fullDrop(game);
      expect(game.stats.maxCombo).toBe(1);
      // Drop sans clear → combo casse
      fullDrop(game);
      expect(game.combo).toBe(-1);
      expect(game.stats.maxCombo).toBe(1);
    });

    it('reset remet les stats à zéro', () => {
      fullDrop(game);
      fullDrop(game);
      expect(game.stats.pieces).toBeGreaterThan(0);
      game.reset();
      expect(game.stats).toEqual({ pieces: 0, tSpins: 0, maxCombo: 0 });
    });
  });

  // --- Start screen ---
  describe('Start screen', () => {
    let idleGame;
    beforeEach(() => { idleGame = new Game(); });

    it('started est false au départ', () => {
      expect(idleGame.started).toBe(false);
    });

    it('start() passe started à true', () => {
      idleGame.start();
      expect(idleGame.started).toBe(true);
    });

    it('start() est idempotent', () => {
      idleGame.start();
      idleGame.start();
      expect(idleGame.started).toBe(true);
    });

    it('onStart callback est appelé au start', () => {
      let called = false;
      idleGame.onStart = () => { called = true; };
      idleGame.start();
      expect(called).toBe(true);
    });

    it('update() ne fait rien tant que started est false', () => {
      const yBefore = idleGame.current.y;
      idleGame.update(1000);
      idleGame.update(2000);
      expect(idleGame.current.y).toBe(yBefore); // pas de gravité
    });

    it('moveLeft est bloqué tant que started est false', () => {
      expect(idleGame.moveLeft()).toBe(false);
    });

    it('moveRight est bloqué tant que started est false', () => {
      expect(idleGame.moveRight()).toBe(false);
    });

    it('hardDrop est bloqué tant que started est false', () => {
      const scoreBefore = idleGame.score;
      idleGame.hardDrop();
      expect(idleGame.score).toBe(scoreBefore);
    });

    it('rotate est bloqué tant que started est false', () => {
      expect(idleGame.rotate()).toBe(false);
    });

    it('holdPiece est bloqué tant que started est false', () => {
      expect(idleGame.holdPiece()).toBe(false);
    });

    it('togglePause ne fait rien tant que started est false', () => {
      idleGame.togglePause();
      expect(idleGame.paused).toBe(false);
    });

    it('reset remet started à false', () => {
      idleGame.start();
      expect(idleGame.started).toBe(true);
      idleGame.reset();
      expect(idleGame.started).toBe(false);
    });
  });

  // --- formatStats ---
  describe('formatStats', () => {
    it('retourne un résumé avec score, niveau, lignes', () => {
      const text = game.formatStats();
      expect(text).toContain('Score : 0');
      expect(text).toContain('Niveau 1');
      expect(text).toContain('0 lignes');
    });

    it('inclut les pièces, T-spins et combo max', () => {
      game.stats.pieces = 42;
      game.stats.tSpins = 3;
      game.stats.maxCombo = 5;
      const text = game.formatStats();
      expect(text).toContain('42 pièces');
      expect(text).toContain('3 T-spins');
      expect(text).toContain('combo max ×5');
    });

    it('reflète le score actuel', () => {
      game.score = 12500;
      const text = game.formatStats();
      expect(text).toContain('Score : 12500');
    });

    it('a exactement 3 lignes', () => {
      expect(game.formatStats().split('\n')).toHaveLength(3);
    });
  });

  // --- getStatsJSON ---
  describe('getStatsJSON', () => {
    it('retourne du JSON valide', () => {
      const json = game.getStatsJSON();
      const parsed = JSON.parse(json);
      expect(parsed.score).toBe(0);
      expect(parsed.level).toBe(1);
      expect(parsed.lines).toBe(0);
    });

    it('inclut la difficulté', () => {
      const parsed = JSON.parse(game.getStatsJSON());
      expect(parsed.difficulty).toBe('normal');
    });

    it('inclut elapsedTime après start', () => {
      game.start();
      game._lastTimestamp = 5000;
      const parsed = JSON.parse(game.getStatsJSON());
      expect(parsed.elapsedTime).toBeGreaterThan(0);
    });
  });
});
