// ============================================================
// 庭のイラスト（鉢・植物・床）を表示する部品
//   <Garden>      … ホームの庭（床の上に、鉢植えを並べる）
//   <PottedPlant> … 鉢＋植物（企業詳細などで大きく見せる）
//   <PlantIcon>   … 植物だけ（企業一覧などの小さいアイコン）
// 画像はすべて、鉢・植物を同じ 512×768px のキャンバスに描いてあるので、
// 同じ大きさで重ねるだけで、植物が鉢の土の位置にぴったり合う。
// ============================================================
import { useEffect, useRef, useState } from "react";
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
// 奥の植物が手前の花で隠れにくいよう、列ごとに横へずらしつつ、床の中心線（x=255）で左右対称にしてある。
// 企業は登録した順に、この順番で置かれる（手前の中央 → 奥の中央 → 左右のペア、の順でバランスよく埋まる）
const SLOTS = [
  { x: 255, y: 372 }, // 手前の中央
  { x: 255, y: 188 }, // 奥の中央
  { x: 183, y: 239 }, // 奥寄りの左
  { x: 328, y: 239 }, // 奥寄りの右
  { x: 83, y: 266 },  // 左端
  { x: 427, y: 266 }, // 右端
  { x: 147, y: 323 }, // 手前寄りの左
  { x: 363, y: 323 }, // 手前寄りの右
];

const FLOOR_SIZE = 512;   // 床の画像の横幅(px)
const STAGE_TOP = 58;     // 床の上に足す、空の余白（一番奥の花の上に、吹き出しを出す場所を作るため）
const STAGE_HEIGHT = 478; // 庭として表示する高さ（空の余白 + 床。床の画像の下の余白は切り落とす）
const POT_SCALE = 0.23;   // 床に対する、鉢＋植物の画像の大きさ
const POT_ANCHOR = { x: 256, y: 730 }; // 鉢＋植物の画像(512×768px)の中での、鉢の底の中心

// 鉢＋植物の画像(512×768px)の中での、植物のてっぺんの高さ（段階ごと）。吹き出しを、この少し上に出す
const PLANT_TOP = { seed: 432, sprout: 398, bud: 170, flower: 54 };

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

  // タップして吹き出しを出している企業のid（null = どれも出していない）
  const [selectedId, setSelectedId] = useState(null);

  // 鉢をタップした時：1回目は吹き出しを出す。吹き出しが出ている鉢をもう1回タップしたら、企業詳細を開く
  const handleTapPot = (company) => {
    if (selectedId === company.id) {
      setSelectedId(null);
      onSelect(company);
    } else {
      setSelectedId(company.id);
    }
  };

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

  // ---- 庭が2つ以上ある時の、切り替え ----
  const scrollRef = useRef(null);              // 横にスクロールする入れ物
  const [pageIndex, setPageIndex] = useState(0); // 今見ている庭（0から数える）
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  // 指定した庭まで、なめらかに移動する
  const goToPage = (index) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  };

  // スクロールした位置から、今どの庭を見ているかを計算する
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    setPageIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  // マウスでつかんで横に動かす（スマホの指でのスワイプは、ブラウザが元々やってくれるので、マウスの時だけ自前で動かす）
  const handlePointerDown = (e) => {
    if (e.pointerType !== "mouse") return;
    const el = scrollRef.current;
    dragRef.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false };
  };

  const handlePointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    const dx = e.clientX - drag.startX;
    if (Math.abs(dx) > 6 && !drag.moved) {
      drag.moved = true;
      scrollRef.current.classList.add("dragging"); // つかんでいる間は、ぴたっと止まる動きを切る
    }
    if (drag.moved) scrollRef.current.scrollLeft = drag.startScroll - dx;
  };

  const handlePointerEnd = () => {
    const drag = dragRef.current;
    if (!drag.active) return;
    drag.active = false;
    const el = scrollRef.current;
    el.classList.remove("dragging");
    if (drag.moved) goToPage(Math.round(el.scrollLeft / el.clientWidth)); // 近い方の庭で止める
  };

  // つかんで動かした直後のクリックは、鉢のタップとして扱わない
  const handleClickCapture = (e) => {
    if (dragRef.current.moved) {
      e.stopPropagation();
      dragRef.current.moved = false;
    }
  };

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
      <div
        className="garden-scroll"
        ref={scrollRef}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onClickCapture={handleClickCapture}
      >
        {pages.map((page, pageIndex) => (
          <div className="garden-page" key={pageIndex}>
            {/* 鉢以外の場所をタップしたら、吹き出しを閉じる */}
            <div className="garden-stage" onClick={() => setSelectedId(null)}>
              <img
                className="garden-floor"
                src={floorImg}
                alt=""
                draggable="false"
                style={{ top: `${(STAGE_TOP / STAGE_HEIGHT) * 100}%` }}
              />
              {page.map((company, i) => {
                const slot = SLOTS[i];
                return (
                  <div
                    className={[
                      "garden-slot",
                      grewIds.includes(company.id) ? "just-grew" : "",
                      selectedId === company.id ? "selected" : "",
                    ].join(" ").trim()}
                    key={company.id}
                    style={{
                      left: `${((slot.x - POT_ANCHOR.x * POT_SCALE) / FLOOR_SIZE) * 100}%`,
                      top: `${((slot.y + STAGE_TOP - POT_ANCHOR.y * POT_SCALE) / STAGE_HEIGHT) * 100}%`,
                      width: `${POT_SCALE * 100}%`,
                      zIndex: slot.y, // 手前（下）にある鉢ほど、上に重ねて描く
                    }}
                  >
                    <PottedPlant company={company} swayDelay={(i * 0.7) % 4} />
                    {/* タップできる範囲は、鉢のまわりだけにする（画像の透明な部分で、隣の鉢のタップを邪魔しないように） */}
                    <button
                      className="garden-slot-hit"
                      onClick={(e) => {
                        e.stopPropagation(); // 庭の「吹き出しを閉じる」まで伝わらないようにする
                        handleTapPot(company);
                      }}
                      title={company.company_name}
                      aria-label={company.company_name}
                    />
                  </div>
                );
              })}
              {/* 吹き出し：タップした鉢の、植物のすぐ上に出す */}
              {page.map((company, i) => {
                if (company.id !== selectedId) return null;
                const slot = SLOTS[i];
                const plantTop = PLANT_TOP[company.growth_stage] || PLANT_TOP.seed;
                // 吹き出しの下端を合わせる高さ（植物のてっぺん）
                const tipY = slot.y + STAGE_TOP - (POT_ANCHOR.y - plantTop) * POT_SCALE;
                // 左右の端の鉢でも、吹き出しが庭からはみ出さないよう、横の位置を内側に寄せる
                const leftPercent = Math.min(72, Math.max(28, (slot.x / FLOOR_SIZE) * 100));
                return (
                  <button
                    className="garden-balloon"
                    key={`balloon-${company.id}`}
                    // top：植物のてっぺんに合わせる。ただし、庭の上端からはみ出さないよう、最低でも56pxは下げる
                    style={{ left: `${leftPercent}%`, top: `max(${(tipY / STAGE_HEIGHT) * 100}%, 56px)` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(null);
                      onSelect(company);
                    }}
                  >
                    <span className="garden-balloon-name">{company.company_name}</span>
                    <span className="garden-balloon-sub">
                      {company.status}
                      {company.short_memo ? `・${company.short_memo}` : ""}
                      <span className="garden-balloon-arrow">›</span>
                    </span>
                  </button>
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
      {/* 庭が2つ以上ある時：矢印と点で、ほかの庭に切り替える（スマホは横スワイプ、PCはドラッグでも切り替えられる） */}
      {pages.length > 1 && (
        <div className="garden-pager">
          <button
            className="garden-pager-arrow"
            onClick={() => goToPage(pageIndex - 1)}
            disabled={pageIndex === 0}
            aria-label="前の庭"
          >
            ‹
          </button>
          <div className="garden-pager-dots">
            {pages.map((_, i) => (
              <button
                key={i}
                className={i === pageIndex ? "garden-pager-dot active" : "garden-pager-dot"}
                onClick={() => goToPage(i)}
                aria-label={`${i + 1}つ目の庭`}
              />
            ))}
          </div>
          <button
            className="garden-pager-arrow"
            onClick={() => goToPage(pageIndex + 1)}
            disabled={pageIndex === pages.length - 1}
            aria-label="次の庭"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
