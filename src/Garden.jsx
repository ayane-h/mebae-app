// ============================================================
// 庭のイラスト（鉢・植物・床）を表示する部品
//   <Garden>      … ホームの庭（床の上に、鉢植えを並べる）
//   <PottedPlant> … 鉢＋植物（企業詳細などで大きく見せる）
//   <PlantIcon>   … 植物だけ（企業一覧などの小さいアイコン）
// 画像はすべて、鉢・植物を同じ 512×768px のキャンバスに描いてあるので、
// 同じ大きさで重ねるだけで、植物が鉢の土の位置にぴったり合う。
// ============================================================
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
export function PottedPlant({ company, width }) {
  return (
    <span className="potted-plant" style={width ? { width: `${width}px` } : undefined}>
      <img className="potted-plant-pot" src={potImageFor(company)} alt="" draggable="false" />
      <img className="potted-plant-plant" src={plantImageFor(company)} alt="" draggable="false" />
    </span>
  );
}

// ---- 植物だけ（小さいアイコン用） ----
// 512×768pxの画像のうち、植物が描かれている部分だけを正方形に切り取って表示する。
// 段階ごとに植物の大きさが違うので、切り取る範囲（左上のx, y と、一辺の長さ size）も段階ごとに決めている
const ICON_CROP = {
  seed: { x: 191, y: 435, size: 150 },
  sprout: { x: 128, y: 320, size: 250 },
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

export function Garden({ companies, onSelect }) {
  // 登録した順（idの小さい順）に並べる。新しい企業を植えても、今までの鉢の位置は変わらない
  const ordered = [...companies].sort((a, b) => a.id - b.id);

  // 1つの庭に置けるのは SLOTS の数まで。超えた分は、次の庭（横スワイプ）に置く
  const pages = [];
  for (let i = 0; i < ordered.length; i += SLOTS.length) {
    pages.push(ordered.slice(i, i + SLOTS.length));
  }
  if (pages.length === 0) pages.push([]); // 1社もない時も、空の庭を1つ見せる

  return (
    <div className="garden-view">
      <div className="garden-scroll">
        {pages.map((page, pageIndex) => (
          <div className="garden-page" key={pageIndex}>
            <div className="garden-stage">
              <img className="garden-floor" src={floorImg} alt="" draggable="false" />
              {page.map((company, i) => {
                const slot = SLOTS[i];
                return (
                  <div
                    className="garden-slot"
                    key={company.id}
                    style={{
                      left: `${((slot.x - POT_ANCHOR.x * POT_SCALE) / FLOOR_SIZE) * 100}%`,
                      top: `${((slot.y - POT_ANCHOR.y * POT_SCALE) / STAGE_HEIGHT) * 100}%`,
                      width: `${POT_SCALE * 100}%`,
                      zIndex: slot.y, // 手前（下）にある鉢ほど、上に重ねて描く
                    }}
                  >
                    <PottedPlant company={company} />
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
      {pages.length > 1 && (
        <p className="garden-hint">← 横にスワイプすると、ほかの庭も見られます（全{pages.length}つ） →</p>
      )}
    </div>
  );
}
