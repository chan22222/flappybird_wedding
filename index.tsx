/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { createClient } from '@supabase/supabase-js';

// --- Supabase Setup ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Configuration ---
const CONFIG = {
  gravity: 0.08,
  jumpStrength: -3, // slightly floaty for easier play
  pipeSpeed: 1.8,
  pipeSpawnRate: 200, // frames
  pipeGap: 330, // vertical gap
  maxAttempts: 10, // Daily limit
};

const OBSTACLES = [
  { text: '야근', emoji: '🏢' },
  { text: '다이어트', emoji: '🥗' },
  { text: '텅장', emoji: '💸' },
  { text: '지하철지연', emoji: '🚇' },
  { text: '집값폭등', emoji: '📈' },
  { text: '코로나', emoji: '😷' },
  { text: '청첩장오타', emoji: '😱' },
  { text: '태풍', emoji: '🌪️' },
];

// --- Types ---
interface ScoreEntry {
  name: string;
  phone: string;
  score: number;
  timestamp: number;
}

// --- Funny Messages ---
const MESSAGES: Record<string, string[]> = {
  '바닥': [
    "벌써 바닥이랑 큰절 연습하시면 안 되죠! 우리 목표는 무사히 식장에 입성하는 겁니다!",
    "바닥과 너무 친해지셨네요! 결혼식장은 저 위에 있답니다!",
    "중력의 법칙을 너무 잘 따르시네요! 하지만 결혼은 중력을 거스르는 거예요!",
    "바닥에 인사는 결혼식 때 하셔도 됩니다! 아직 이르다고요!",
  ],
  '하늘': [
    "아니, 식장 가기도 전에 벌써 하늘로 승천하시면 어떡합니까! 마음이 너무 앞서가셨네요!",
    "천국 가시기엔 아직 일러요! 먼저 결혼식부터 하셔야죠!",
    "너무 들뜨셨나 봐요! 하늘 높이 날아가시면 안 됩니다!",
    "달달한 신혼을 앞두고 벌써 승천하시면 곤란해요!",
  ],
  '야근': [
    "야근의 늪에 빠지셨군요! 결혼하면 야근 핑계 못 대실 텐데!",
    "야근 앞에서는 사랑도 무력하군요! 칼퇴근 연습 좀 하셔야겠어요!",
    "결혼식 전날도 야근하실 건 아니시죠? 연습 좀 하세요!",
  ],
  '다이어트': [
    "다이어트의 유혹을 이기지 못하셨군요! 웨딩 촬영 때문에 고생이 많으시네요!",
    "살과의 전쟁에서 패배하셨군요! 결혼식 때는 드레스가 터지지 않게 조심하세요!",
    "다이어트가 발목을 잡았군요! 뷔페에서 맘껏 드세요, 어차피 망했어요!",
  ],
  '텅장': [
    "텅장의 현실 앞에 무릎 꿇으셨군요! 결혼 준비 비용이 무섭죠?",
    "통장이 텅~ 비었군요! 축의금으로 메꿔지길 기도합니다!",
    "텅장에 막히셨네요! 신혼여행은 국내로 하시는 건 어떨까요?",
  ],
  '지하철지연': [
    "지하철 지연에 당하셨군요! 결혼식 날은 택시 타세요, 제발!",
    "지하철이 또 말썽이군요! 식장까지 뛰어가실 각오 하셔야겠어요!",
    "지하철 지연 앞에서는 장사 없네요! 일찍 출발하세요!",
  ],
  '집값폭등': [
    "역시 집값 폭등 앞에서는 천하의 신랑·신부도 무릎을 꿇는군요!",
    "집값에 막히셨군요! 전세라도 구하셨으면 좋겠네요!",
    "집값 폭등이 발목을 잡았네요! 월세 살이의 운명인가요!",
  ],
  '코로나': [
    "코로나 방역 수칙을 너무 엄격하게 지키느라 예식장 근처에도 못 가셨군요!",
    "코로나가 또 발목을 잡았네요! 마스크 꼭 쓰세요!",
    "코로나 시대의 결혼은 정말 힘들죠! 비대면 결혼식은 어떠세요?",
  ],
  '청첩장오타': [
    "청첩장 오타에 당하셨군요! 꼼꼼히 확인 좀 하세요!",
    "오타의 저주에 걸리셨네요! 날짜 틀린 거 아니죠?",
    "청첩장 오타라니! 설마 신부 이름을 틀리신 건 아니겠죠?",
  ],
  '태풍': [
    "태풍에 날아가셨군요! 야외 결혼식은 취소하시는 게...!",
    "태풍의 위력 앞에 사랑도 날아갔네요! 실내 예식장 알아보세요!",
    "태풍에 휩쓸리셨군요! 결혼식 날 맑으면 다행이에요!",
  ],
};

const HIGH_SCORE_MESSAGES = [
  "와! 대단해요! 무사히 예식장에 도착할 수 있겠는데요?",
  "이 정도면 결혼 준비 만렙이시네요! 축하드립니다!",
  "장애물을 척척 피하시다니! 결혼 생활도 이렇게 잘 하실 거예요!",
  "실력이 예술이시네요! 신혼여행도 순탄하겠어요!",
];

function getRandomMessage(obstacle: string, score: number): string {
  if (score >= 15) {
    return HIGH_SCORE_MESSAGES[Math.floor(Math.random() * HIGH_SCORE_MESSAGES.length)];
  }

  const messages = MESSAGES[obstacle] || MESSAGES['바닥'];
  const msg = messages[Math.floor(Math.random() * messages.length)];

  // 점수 언급 추가
  if (score <= 3) {
    return `겨우 ${score}점이라니! ${msg}`;
  }
  return msg;
}

// --- Game Engine ---
class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  
  state: 'MENU' | 'READY' | 'PLAYING' | 'GAMEOVER' = 'MENU';
  score: number = 0;
  frames: number = 0;
  
  // Entities
  bird: { x: number; y: number; velocity: number; radius: number; rotation: number };
  pipes: Array<{ x: number; y: number; width: number; height: number; passed: boolean; type: 'TOP' | 'BOTTOM'; label?: string; emoji?: string }>;
  
  // DOM Elements
  uiMenu: HTMLElement;
  uiGameOver: HTMLElement;
  scoreDisplay: HTMLElement;
  rankDisplay: HTMLElement;
  aiMessageDisplay: HTMLElement;
  attemptsDisplay: HTMLElement;

  // Cheat code tracking
  cheatBuffer: string = '';
  
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    document.getElementById('app')!.appendChild(this.canvas);
    
    this.createUI();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    // Controls
    const jumpAction = (e: Event) => {
      e.preventDefault();
      if (this.state === 'MENU') {
        this.startGame();
      } else if (this.state === 'READY') {
        this.state = 'PLAYING';
        this.jump();
      } else if (this.state === 'PLAYING') {
        this.jump();
      }
    };
    
    this.canvas.addEventListener('mousedown', jumpAction);
    this.canvas.addEventListener('touchstart', jumpAction, { passive: false });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') jumpAction(e);

      // Cheat code detection
      this.cheatBuffer += e.key.toLowerCase();
      if (this.cheatBuffer.length > 10) {
        this.cheatBuffer = this.cheatBuffer.slice(-10);
      }
      if (this.cheatBuffer.includes('coin')) {
        this.addExtraLife();
        this.cheatBuffer = '';
      }
    });

    // Initial Setup
    this.reset();
    this.loop();
  }
  
  createUI() {
    // Menu Overlay
    this.uiMenu = document.createElement('div');
    this.uiMenu.className = 'overlay';
    this.uiMenu.innerHTML = `
      <h1>무사히 예식장까지!</h1>
      <div style="font-size: 4rem; margin: 20px;">🤵❤️👰</div>
      <p>화면을 터치해 장애물을 피하세요!</p>
      <p style="font-size: 0.8rem; color: #888;">하루 최대 ${CONFIG.maxAttempts}회 도전 가능</p>
      <p id="attemptsDisplay" style="font-size: 0.9rem; color: #e91e63; font-weight: bold;"></p>
      <button class="btn" id="startBtn">게임 시작</button>
    `;
    document.getElementById('app')!.appendChild(this.uiMenu);

    this.attemptsDisplay = this.uiMenu.querySelector('#attemptsDisplay')!;
    this.updateAttemptsDisplay();

    this.uiMenu.querySelector('#startBtn')!.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent immediate jump
        this.startGame();
    });

    // Score Display
    this.scoreDisplay = document.createElement('div');
    this.scoreDisplay.className = 'score-board hidden';
    this.scoreDisplay.innerText = '0';
    document.getElementById('app')!.appendChild(this.scoreDisplay);

    // Game Over Overlay
    this.uiGameOver = document.createElement('div');
    this.uiGameOver.className = 'overlay hidden';
    this.uiGameOver.innerHTML = `
      <h2>게임 종료</h2>
      <div id="finalScore" style="font-size: 2.5rem; color: var(--accent-color); font-weight: bold;">0점</div>
      
      <div class="ai-message" id="aiMessage"></div>

      <div class="input-group">
        <input type="text" id="inputName" placeholder="이름 (예: 홍길동)" maxlength="10">
        <input type="tel" id="inputPhone" placeholder="전화번호 뒷자리 (예: 1234)" maxlength="4">
      </div>
      
      <button class="btn" id="submitScoreBtn">기록 등록하기</button>
      
      <div class="leaderboard" id="leaderboardList">
        <!-- Ranks go here -->
      </div>
      
      <button class="btn" id="restartBtn" style="background: #aaa; font-size: 0.9rem; padding: 10px 20px;">다시 하기</button>
    `;
    document.getElementById('app')!.appendChild(this.uiGameOver);

    // Event Listeners for Game Over UI
    this.uiGameOver.querySelector('#submitScoreBtn')!.addEventListener('click', (e) => {
        e.stopPropagation();
        this.submitScore();
    });
    
    this.uiGameOver.querySelector('#restartBtn')!.addEventListener('click', (e) => {
        e.stopPropagation();
        this.reset();
        this.uiGameOver.classList.add('hidden');
        this.uiMenu.classList.remove('hidden');
        this.state = 'MENU';
        this.updateAttemptsDisplay();
    });
  }
  
  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }
  
  reset() {
    this.bird = {
      x: this.width * 0.2,
      y: this.height / 2,
      velocity: 0,
      radius: 20,
      rotation: 0
    };
    this.pipes = [];
    this.score = 0;
    this.frames = 0;
    this.scoreDisplay.innerText = '0';
  }

  getAttemptsKey(): string {
    const today = new Date().toDateString();
    return `wedding_game_attempts_${today}`;
  }

  getRemainingAttempts(): number {
    const attempts = parseInt(localStorage.getItem(this.getAttemptsKey()) || '0');
    return CONFIG.maxAttempts - attempts;
  }

  updateAttemptsDisplay() {
    const remaining = this.getRemainingAttempts();
    this.attemptsDisplay.innerText = `현재 ${remaining}회 남음`;
  }

  addExtraLife() {
    const storeKey = this.getAttemptsKey();
    const attempts = parseInt(localStorage.getItem(storeKey) || '0');
    if (attempts > 0) {
      localStorage.setItem(storeKey, (attempts - 1).toString());
      this.updateAttemptsDisplay();
      alert('코인 사용! 도전 기회 +1');
    } else {
      alert('이미 최대 횟수입니다!');
    }
  }

  checkAttemptLimit(): boolean {
    const attempts = parseInt(localStorage.getItem(this.getAttemptsKey()) || '0');

    if (attempts >= CONFIG.maxAttempts) {
        alert(`오늘은 기회를 다 썼어요! 내일 다시 도전해주세요. (최대 ${CONFIG.maxAttempts}회)`);
        return false;
    }

    localStorage.setItem(this.getAttemptsKey(), (attempts + 1).toString());
    this.updateAttemptsDisplay();
    return true;
  }
  
  startGame() {
    if (!this.checkAttemptLimit()) return;

    this.state = 'READY';
    this.uiMenu.classList.add('hidden');
    this.uiGameOver.classList.add('hidden');
    this.scoreDisplay.classList.remove('hidden');
    this.reset();
  }
  
  jump() {
    this.bird.velocity = CONFIG.jumpStrength;
  }
  
  endGame(collisionObstacle: string = '바닥') {
    this.state = 'GAMEOVER';
    this.scoreDisplay.classList.add('hidden');
    this.uiGameOver.classList.remove('hidden');
    
    const finalScoreEl = this.uiGameOver.querySelector('#finalScore')!;
    finalScoreEl.textContent = `${this.score}점`;

    // Reset input fields
    (this.uiGameOver.querySelector('#inputName') as HTMLInputElement).value = '';
    (this.uiGameOver.querySelector('#inputPhone') as HTMLInputElement).value = '';
    (this.uiGameOver.querySelector('#submitScoreBtn') as HTMLButtonElement).disabled = false;
    (this.uiGameOver.querySelector('#submitScoreBtn') as HTMLButtonElement).innerText = '기록 등록하기';

    this.renderLeaderboard();
    this.generateComment(collisionObstacle);
  }

  generateComment(obstacle: string) {
    const aiContainer = document.getElementById('aiMessage')!;
    const message = getRandomMessage(obstacle, this.score);
    aiContainer.innerText = `💬 ${message}`;
  }

  async submitScore() {
    const nameInput = document.getElementById('inputName') as HTMLInputElement;
    const phoneInput = document.getElementById('inputPhone') as HTMLInputElement;
    const btn = document.getElementById('submitScoreBtn') as HTMLButtonElement;

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!name || phone.length < 4) {
        alert("이름과 전화번호 뒷자리 4자리를 정확히 입력해주세요.");
        return;
    }

    btn.disabled = true;
    btn.innerText = "등록 중...";

    try {
        const { data, error } = await supabase
            .from('fluffytest')
            .insert([{ name, phone, score: this.score }])
            .select()
            .single();

        if (error) throw error;

        btn.innerText = "등록 완료!";
        await this.renderLeaderboard(data);
    } catch (e) {
        console.error(e);
        btn.disabled = false;
        btn.innerText = "기록 등록하기";
        alert("등록 실패! 다시 시도해주세요.");
    }
  }

  async renderLeaderboard(currentEntry?: { id?: number; name: string; phone: string; score: number }) {
    const list = document.getElementById('leaderboardList')!;
    list.innerHTML = '<div style="color:#888;text-align:center;">로딩 중...</div>';

    try {
        // Get top 5
        const { data: top5, error } = await supabase
            .from('fluffytest')
            .select('*')
            .order('score', { ascending: false })
            .order('created_at', { ascending: true })
            .limit(5);

        if (error) throw error;

        list.innerHTML = '';

        (top5 || []).forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'rank-item';
            if (currentEntry?.id && item.id === currentEntry.id) {
                div.classList.add('highlight');
            }
            div.innerHTML = `
                <span>${index + 1}위 ${item.name} (${item.phone})</span>
                <span>${item.score}점</span>
            `;
            list.appendChild(div);
        });

        // If user entry exists and not in top 5, find their rank
        if (currentEntry?.id) {
            const isInTop5 = top5?.some(item => item.id === currentEntry.id);
            if (!isInTop5) {
                // Get user's rank
                const { count } = await supabase
                    .from('fluffytest')
                    .select('*', { count: 'exact', head: true })
                    .gt('score', currentEntry.score);

                const userRank = (count || 0) + 1;

                const div = document.createElement('div');
                div.className = 'rank-item highlight';
                div.style.marginTop = '10px';
                div.style.borderTop = '1px dashed #ccc';
                div.innerHTML = `
                    <span>${userRank}위 ${currentEntry.name} (${currentEntry.phone})</span>
                    <span>${currentEntry.score}점</span>
                `;
                list.appendChild(div);
            }
        }
    } catch (e) {
        console.error(e);
        list.innerHTML = '<div style="color:#888;text-align:center;">리더보드 로딩 실패</div>';
    }
  }

  update() {
    if (this.state !== 'PLAYING') return;
    
    this.frames++;
    
    // Physics
    this.bird.velocity += CONFIG.gravity;
    this.bird.y += this.bird.velocity;
    
    // Rotation logic (reduced for smoother feel)
    if (this.bird.velocity < 0) this.bird.rotation = -10 * Math.PI / 180;
    else {
        this.bird.rotation += 1 * Math.PI / 180;
        if (this.bird.rotation > 30 * Math.PI / 180) this.bird.rotation = 30 * Math.PI / 180;
    }

    // Ceiling Collision
    if (this.bird.y - this.bird.radius <= 0) {
        this.endGame('하늘');
        return;
    }

    // Floor Collision
    if (this.bird.y + this.bird.radius >= this.height) {
        this.endGame('바닥');
        return;
    }
    
    // Difficulty Scaling (10% per tier)
    let currentSpeed = CONFIG.pipeSpeed;
    let currentGap = CONFIG.pipeGap;

    if (this.score > 10) {
        currentSpeed *= 1.1;  // 10% 증가
        currentGap *= 0.95;
    }
    if (this.score > 20) {
        currentSpeed *= 1.1;  // 추가 10% 증가
        currentGap *= 0.95;
    }
    
    // Pipe Spawning
    if (this.frames % CONFIG.pipeSpawnRate === 0) {
        const obstacleData = OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)];
        const minHeight = 50;
        const maxHeight = this.height - currentGap - minHeight;
        const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
        const bottomY = topHeight + currentGap;
        
        // Add Top Pipe
        this.pipes.push({
            x: this.width,
            y: 0,
            width: 60,
            height: topHeight,
            passed: false,
            type: 'TOP',
            emoji: obstacleData.emoji,
            label: obstacleData.text
        });
        
        // Add Bottom Pipe
        this.pipes.push({
            x: this.width,
            y: bottomY,
            width: 60,
            height: this.height - bottomY,
            passed: false,
            type: 'BOTTOM',
            emoji: obstacleData.emoji,
            label: obstacleData.text
        });
    }
    
    // Pipe Logic
    for (let i = 0; i < this.pipes.length; i++) {
        const p = this.pipes[i];
        p.x -= currentSpeed;
        
        // Collision
        if (
            this.bird.x + this.bird.radius > p.x &&
            this.bird.x - this.bird.radius < p.x + p.width &&
            this.bird.y + this.bird.radius > p.y &&
            this.bird.y - this.bird.radius < p.y + p.height
        ) {
            this.endGame(p.label || '장애물');
            return;
        }
        
        // Scoring (only count top pipe to avoid double counting)
        if (p.type === 'TOP' && p.x + p.width < this.bird.x && !p.passed) {
            this.score++;
            this.scoreDisplay.innerText = this.score.toString();
            p.passed = true;
        }
    }
    
    // Remove off-screen pipes
    if (this.pipes.length > 0 && this.pipes[0].x < -100) {
        this.pipes.shift();
    }
  }
  
  draw() {
    // Clear
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw Background (Simple Cityscape effect)
    this.ctx.fillStyle = '#f0f8ff';
    this.ctx.fillRect(0, this.height - 100, this.width, 100);
    
    // Draw Pipes with modern design
    for (const p of this.pipes) {
        this.ctx.save();

        // Shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 4;
        this.ctx.shadowOffsetY = 4;

        // Gradient fill
        const gradient = this.ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
        gradient.addColorStop(0, '#ff9a9e');
        gradient.addColorStop(0.5, '#fecfef');
        gradient.addColorStop(1, '#fecfef');

        // Draw rounded rectangle
        const radius = 12;
        this.ctx.beginPath();
        if (p.type === 'TOP') {
            this.ctx.moveTo(p.x + radius, p.y);
            this.ctx.lineTo(p.x + p.width - radius, p.y);
            this.ctx.quadraticCurveTo(p.x + p.width, p.y, p.x + p.width, p.y + radius);
            this.ctx.lineTo(p.x + p.width, p.y + p.height - radius);
            this.ctx.quadraticCurveTo(p.x + p.width, p.y + p.height, p.x + p.width - radius, p.y + p.height);
            this.ctx.lineTo(p.x + radius, p.y + p.height);
            this.ctx.quadraticCurveTo(p.x, p.y + p.height, p.x, p.y + p.height - radius);
            this.ctx.lineTo(p.x, p.y + radius);
            this.ctx.quadraticCurveTo(p.x, p.y, p.x + radius, p.y);
        } else {
            this.ctx.moveTo(p.x + radius, p.y);
            this.ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + radius);
            this.ctx.lineTo(p.x, p.y + p.height);
            this.ctx.lineTo(p.x + p.width, p.y + p.height);
            this.ctx.lineTo(p.x + p.width, p.y + radius);
            this.ctx.quadraticCurveTo(p.x + p.width, p.y, p.x + p.width - radius, p.y);
        }
        this.ctx.closePath();
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Border
        this.ctx.shadowColor = 'transparent';
        this.ctx.strokeStyle = '#e91e63';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // Inner highlight
        const innerGradient = this.ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
        innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        innerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = innerGradient;
        this.ctx.fillRect(p.x + 5, p.y + 5, 15, p.height - 10);

        this.ctx.restore();

        // Emoji and label with better styling
        this.ctx.save();
        this.ctx.textAlign = 'center';

        const label = p.label || '';
        const needsWrap = label.length > 3;
        const line1 = needsWrap ? label.slice(0, Math.ceil(label.length / 2)) : label;
        const line2 = needsWrap ? label.slice(Math.ceil(label.length / 2)) : '';

        if (p.type === 'TOP') {
            // Label badge at bottom of top pipe
            const badgeY = p.height - 45;
            const badgeHeight = needsWrap ? 34 : 22;
            this.ctx.fillStyle = 'rgba(233, 30, 99, 0.9)';
            this.ctx.beginPath();
            this.ctx.roundRect(p.x + 3, badgeY - badgeHeight/2, p.width - 6, badgeHeight, 8);
            this.ctx.fill();

            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 11px Arial';
            if (needsWrap) {
                this.ctx.fillText(line1, p.x + p.width/2, badgeY - 5);
                this.ctx.fillText(line2, p.x + p.width/2, badgeY + 9);
            } else {
                this.ctx.fillText(label, p.x + p.width/2, badgeY + 4);
            }

            // Emoji below label
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillText(p.emoji || '', p.x + p.width/2, p.height - 12);
        } else {
            // Label badge at top of bottom pipe
            const badgeY = p.y + 25;
            const badgeHeight = needsWrap ? 34 : 22;
            this.ctx.fillStyle = 'rgba(233, 30, 99, 0.9)';
            this.ctx.beginPath();
            this.ctx.roundRect(p.x + 3, badgeY - badgeHeight/2, p.width - 6, badgeHeight, 8);
            this.ctx.fill();

            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 11px Arial';
            if (needsWrap) {
                this.ctx.fillText(line1, p.x + p.width/2, badgeY - 5);
                this.ctx.fillText(line2, p.x + p.width/2, badgeY + 9);
            } else {
                this.ctx.fillText(label, p.x + p.width/2, badgeY + 4);
            }

            // Emoji below
            this.ctx.font = 'bold 28px Arial';
            this.ctx.fillText(p.emoji || '', p.x + p.width/2, p.y + 65);
        }
        this.ctx.restore();
    }
    
    // Draw Bird
    this.ctx.save();
    this.ctx.translate(this.bird.x, this.bird.y);
    this.ctx.rotate(this.bird.rotation);
    // Draw Couple Emojis
    this.ctx.font = '36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('🤵👰', 0, 0);
    this.ctx.restore();
    
    // Draw Floor
    /* Drawn as part of background simple rect */

    // Draw Ready Message
    if (this.state === 'READY') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.width, this.height);

      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('화면을 터치하면 시작!', this.width / 2, this.height / 2 + 60);

      this.ctx.font = '16px Arial';
      this.ctx.fillText('장애물을 피해 예식장까지!', this.width / 2, this.height / 2 + 95);
    }
  }
  
  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}

// Start Game
window.onload = () => {
  new Game();
};
