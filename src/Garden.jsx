// ============================================================
// 庭のイラスト（鉢・植物・床）を表示する部品
//   <Garden>      … ホームの庭（床の上に、鉢植えを並べる）
//   <PottedPlant> … 鉢＋植物（企業詳細などで大きく見せる）
//   <PlantIcon>   … 植物だけ（企業一覧などの小さいアイコン）
// 画像はすべて、鉢・植物を同じ 512×768px のキャンバスに描いてあるので、
// 同じ大きさで重ねるだけで、植物が鉢の土の位置にぴったり合う。
// ============================================================
import { useEffect, useState } from "react";
import floorImg from "./assets/garden/floor.png";
import potTerracotta from "./assets/garden/pot-terracotta.png";
import potDark from "./assets/garden/pot-dark.png";
import plantSeed from "./assets/garden/plant-seed.png";
import plantSprout from "./assets/garden/plant-sprout.png";
import plantBud from "./assets/garden/plant-bud.png";
import flowerSunflower from "./assets/garden/plant-flower-sunflower.png";
import flowerTulip from "./assets/garden/plant-flower-tulip.png";

// 鉢・花の種類。画像を増やしたら、ここに足すだけでよい
const POTS = [potTerracotta, potDark];
const FLOWERS = [flowerSunflower, flowerTulip];

// 成長段階 → 植物の画像（花だけは種類があるので、下の関数で選ぶ）
const PLANT_BY_STAGE = {
  seed: plantSeed,
  sprout: plantSprout,
  bud: plantBud,
};

// どの鉢・どの花になるかは、企業の番号(id)から決める
// （同じ企業は、いつ開いても同じ鉢・同じ花になる。DBに保存しなくて済む）
function potImageFor(company) {
  return POTS[company.id % POTS.length];
}

function plantImageFor(company) {
  if (company.growth_stage === "flower") {
    // 鉢の種類と花の種類の組み合わせが偏らないよう、鉢とは別の割り方をする
    return FLOWERS[Math.floor(company.id / POTS.length) % FLOWERS.length];
  }
  return PLANT_BY_STAGE[company.growth_stage] || plantSeed;
}

// ---- 鉢＋植物 ----
// width: 表示する横幅(px)。高さは画像の比率(2:3)で自動的に決まる
// swayDelay: 植物が風で揺れ始めるまでの時間(秒)。鉢ごとにずらすと、全部が同じ動きにならない
export function PottedPlant({ company, width, swayDelay = 0 }) {
  const stage = company.growth_stage || "seed";
  return (
    <span className="potted-plant" style={width ? { width: `${width}px` } : undefined}>
      <img className="potted-plant-pot" src={potImageFor(company)} alt="" draggable="false" />
      <img
        className={`potted-plant-plant sway-${stage}`}
        src={plantImageFor(company)}
        alt=""
        draggable="false"
        style={{ animationDelay: `${swayDelay}s` }}
      />
      {/* 花が咲いた鉢には、ときどき小さな光を出す */}
      {stage === "flower" && (
        <span className="plant-sparkle" style={{ animationDelay: `${swayDelay + 1.5}s` }}>✦</span>
      )}
    </span>
  );
}

// ---- 植物だけ（小さいアイコン用） ----
// 512×768pxの画像のうち、植物が描かれている部分だけを正方形に切り取って表示する。
// 段階ごとに植物の大きさが違うので、切り取る範囲（左上のx, y と、一辺の長さ size）も段階ごとに決めている
const ICON_CROP = {
  seed: { x: 191, y: 435, size: 150 },
  sprout: { x: 128, y: 330, size: 250 },
  bud: { x: 43, y: 112, size: 420 },
  flower: { x: 6, y: 30, size: 500 },
};

export function PlantIcon({ company, size }) {
  const crop = ICON_CROP[company.growth_stage] || ICON_CROP.seed;
  return (
    <span className="plant-icon" style={{ width: `${size}px`, height: `${size}px` }}>
      <img
        src={plantImageFor(company)}
        alt=""
        draggable="false"
        style={{
          width: `${(512 / crop.size) * 100}%`,
          left: `${(-crop.x / crop.size) * 100}%`,
          top: `${(-crop.y / crop.size) * 100}%`,
        }}
      />
    </span>
  );
}

// ---- 植える場面（「◯◯を植えました」の画面で使う） ----
// 種が右上から飛んできて、鉢の土に着地する → 鉢がふにょっと弾む →（sprouts が true なら）芽が出る。
// 動きはすべてCSSのアニメーション（garden.css の planting-◯◯）で、ここでは絵を重ねているだけ
// company: { id } があればよい（どの鉢を使うかを id から決めるため）
export function PlantingScene({ company, sprouts = false }) {
  return (
    <div className={sprouts ? "planting-scene sprouts" : "planting-scene"}>
      <div className="planting-canvas">
        {/* 着地した時に、鉢と中身をまとめて弾ませるための入れ物 */}
        <div className="planting-body">
          <img className="planting-layer" src={potImageFor(company)} alt="" draggable="false" />
          <img className="planting-layer planting-sprout" src={plantSprout} alt="" draggable="false" />
        </div>
        {/* 種：横の動きと縦の動きを別々の入れ物で動かすと、弧を描いて落ちる動きになる */}
        <div className="planting-seed-x">
          <div className="planting-seed-y">
            <img className="planting-layer planting-seed" src={plantSeed} alt="" draggable="false" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- 双葉のマーク ----
// アプリのマークとして使う双葉（ログイン画面・ボタン・「植えました」の画面など）。絵文字の代わりに使う
export function SproutIcon({ size }) {
  return <PlantIcon company={{ id: 0, growth_stage: "sprout" }} size={size} />;
}

// ---- 庭 ----
// 床の画像(512×512px)の上での、鉢を置く場所（鉢の底の中心の座標）。
// 奥の植物が手前の花で隠れにくいよう、少しずつ横にずらしてある。企業は登録した順に、この順番で置かれる
const SLOTS = [
  { x: 200, y: 230 },
  { x: 338, y: 240 },
  { x: 258, y: 372 },
  { x: 92, y: 264 },
  { x: 440, y: 268 },
  { x: 160, y: 328 },
  { x: 365, y: 318 },
  { x: 258, y: 188 },
];

const FLOOR_SIZE = 512;   // 床の画像の横幅(px)
const STAGE_HEIGHT = 420; // 庭として表示する高さ（床の画像の下の余白は切り落とす）
const POT_SCALE = 0.24;   // 床に対する、鉢＋植物の画像の大きさ
const POT_ANCHOR = { x: 256, y: 730 }; // 鉢＋植物の画像(512×768px)の中での、鉢の底の中心

// 今の時刻から、空の色の種類を決める（朝・昼・夕方・夜）
function skyPeriodOf(date) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 10) return "morning";
  if (hour >= 10 && hour < 16) return "day";
  if (hour >= 16 && hour < 19) return "evening";
  return "night";
}

// 時間帯の並び順と、画面に出す名前（スライダーの左から右の順）
const SKY_PERIODS = ["morning", "day", "evening", "night"];
const SKY_LABEL = { morning: "朝", day: "昼", evening: "夕方", night: "夜" };

// 前に庭を見た時の成長段階を、このブラウザに覚えておくための名前
const SEEN_STAGES_KEY = "mebae-garden-stages";

// period: 空の色を固定したい時だけ渡す（"morning" | "day" | "evening" | "night"）。渡さなければ今の時刻で決まる
// showTimeSlider: true にすると、時間帯を自分で切り替えられるスライダーを出す（デモで、空の変化を見てもらうため）
export function Garden({ companies, onSelect, period, showTimeSlider = false }) {
  // スライダーで選んだ時間帯（null の間は、今の時刻のまま）
  const [manualPeriod, setManualPeriod] = useState(null);
  const sky = manualPeriod || period || skyPeriodOf(new Date());

  // 前に見た時から育った鉢・新しく植えた鉢を、ぽんと弾ませる
  const [grewIds, setGrewIds] = useState([]);
  const stageSignature = companies.map((c) => `${c.id}:${c.growth_stage}`).sort().join(",");

  useEffect(() => {
    if (companies.length === 0) return;
    let seen = null;
    try {
      seen = JSON.parse(localStorage.getItem(SEEN_STAGES_KEY));
    } catch {
      seen = null;
    }

    // 初めて庭を見る時（覚えているものが無い時）は、弾ませない
    const changed = seen
      ? companies.filter((c) => seen[c.id] !== c.growth_stage).map((c) => c.id)
      : [];

    const next = {};
    companies.forEach((c) => {
      next[c.id] = c.growth_stage;
    });
    try {
      localStorage.setItem(SEEN_STAGES_KEY, JSON.stringify(next));
    } catch {
      // 保存できなくても、庭の表示には影響しない
    }

    if (changed.length === 0) return;
    setGrewIds(changed);
    const timer = setTimeout(() => setGrewIds([]), 1600); // 弾み終わったら、目印を外す
    return () => clearTimeout(timer);
  }, [stageSignature]); // eslint-disable-line react-hooks/exhaustive-deps

  // 登録した順（idの小さい順）に並べる。新しい企業を植えても、今までの鉢の位置は変わらない
  const ordered = [...companies].sort((a, b) => a.id - b.id);

  // 1つの庭に置けるのは SLOTS の数まで。超えた分は、次の庭（横スワイプ）に置く
  const pages = [];
  for (let i = 0; i < ordered.length; i += SLOTS.length) {
    pages.push(ordered.slice(i, i + SLOTS.length));
  }
  if (pages.length === 0) pages.push([]); // 1社もない時も、空の庭を1つ見せる

  return (
    <div className={`garden-view garden-sky-${sky}`}>
      <div className="garden-scroll">
        {pages.map((page, pageIndex) => (
          <div className="garden-page" key={pageIndex}>
            <div className="garden-stage">
              <img className="garden-floor" src={floorImg} alt="" draggable="false" />
              {page.map((company, i) => {
                const slot = SLOTS[i];
                return (
                  <div
                    className={grewIds.includes(company.id) ? "garden-slot just-grew" : "garden-slot"}
                    key={company.id}
                    style={{
                      left: `${((slot.x - POT_ANCHOR.x * POT_SCALE) / FLOOR_SIZE) * 100}%`,
                      top: `${((slot.y - POT_ANCHOR.y * POT_SCALE) / STAGE_HEIGHT) * 100}%`,
                      width: `${POT_SCALE * 100}%`,
                      zIndex: slot.y, // 手前（下）にある鉢ほど、上に重ねて描く
                    }}
                  >
                    <PottedPlant company={company} swayDelay={(i * 0.7) % 4} />
                    {/* タップできる範囲は、鉢のまわりだけにする（画像の透明な部分で、隣の鉢のタップを邪魔しないように） */}
                    <button
                      className="garden-slot-hit"
                      onClick={() => onSelect(company)}
                      title={company.company_name}
                      aria-label={company.company_name}
                    />
                  </div>
                );
              })}
              {page.length === 0 && (
                <p className="garden-empty">「＋植える」から、最初の企業を植えてみましょう</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {showTimeSlider && (
        <div className="sky-slider">
          <svg className="sky-slider-icon" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 2.5 V5 M12 19 V21.5 M2.5 12 H5 M19 12 H21.5 M5 5 L6.8 6.8 M17.2 17.2 L19 19 M19 5 L17.2 6.8 M6.8 17.2 L5 19" />
          </svg>
          <input
            className="sky-slider-range"
            type="range"
            min="0"
            max={SKY_PERIODS.length - 1}
            step="1"
            value={SKY_PERIODS.indexOf(sky)}
            onChange={(e) => setManualPeriod(SKY_PERIODS[Number(e.target.value)])}
            aria-label="庭の時間帯"
          />
          <svg className="sky-slider-icon" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 12.5 A7 7 0 1 1 11.8 5.2 A5.6 5.6 0 0 0 18 12.5 Z" />
          </svg>
          <span className="sky-slider-label">{SKY_LABEL[sky]}</span>
        </div>
      )}
      {pages.length > 1 && (
        <p className="garden-hint">← 横にスワイプすると、ほかの庭も見られます（全{pages.length}つ） →</p>
      )}
    </div>
  );
}
