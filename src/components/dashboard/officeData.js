export const TILE_SIZE = 48;
export const MAP_COLS = 20;
export const MAP_ROWS = 15;

export const INITIAL_CHARACTERS = [
  {
    id: "ceo",
    charId: 0,
    name: "ผู้จัดการพอร์ต (CEO)",
    feature: "summary",
    x: 3 * TILE_SIZE,
    y: 3 * TILE_SIZE + 12,
    dir: 0,
    frame: 1,
    frameTimer: 0,
    state: "idle",
    stateTimer: 2,
    hoverText: "ผู้จัดการพอร์ต (ยอดรวมพอร์ต & KPI)"
  },
  {
    id: "accountant",
    charId: 1,
    name: "หัวหน้าฝ่ายบัญชี",
    feature: "ledger",
    x: 9 * TILE_SIZE,
    y: 3 * TILE_SIZE + 12,
    dir: 0,
    frame: 1,
    frameTimer: 0,
    state: "idle",
    stateTimer: 3,
    hoverText: "ฝ่ายบัญชี (ตารางรายชื่อและประวัติธุรกรรม)"
  },
  {
    id: "analyst",
    charId: 2,
    name: "นักวิเคราะห์การลงทุน",
    feature: "analyzer",
    x: 9 * TILE_SIZE,
    y: 11 * TILE_SIZE + 12,
    dir: 0,
    frame: 1,
    frameTimer: 0,
    state: "idle",
    stateTimer: 4,
    hoverText: "นักวิเคราะห์ (สืบค้นข้อมูลและกราฟหุ้น)"
  },
  {
    id: "receptionist",
    charId: 3,
    name: "ฝ่ายประชาสัมพันธ์",
    feature: "import",
    x: 2 * TILE_SIZE,
    y: 11 * TILE_SIZE - 4,
    dir: 0,
    frame: 1,
    frameTimer: 0,
    state: "idle",
    stateTimer: 2,
    hoverText: "ฝ่ายต้อนรับ (นำเข้าข้อมูลจาก Dime & สลิปธุรกรรม)"
  },
  {
    id: "dividends",
    charId: 4,
    name: "พนักงานปันผล",
    feature: "dividends",
    x: 16 * TILE_SIZE,
    y: 3 * TILE_SIZE,
    targetX: 16 * TILE_SIZE,
    targetY: 3 * TILE_SIZE,
    dir: 0,
    frame: 1,
    frameTimer: 0,
    state: "idle",
    isWanderer: true,
    idleTimer: 2.0,
    speed: 48,
    hoverText: "พนักงานฝ่ายเงินปันผล (ปฏิทินปันผล)"
  },
  {
    id: "risk_left",
    charId: 5,
    name: "ผู้ประเมินความเสี่ยง A",
    feature: "risk",
    x: 15 * TILE_SIZE - 8,
    y: 11 * TILE_SIZE + 8,
    dir: 0,
    frame: 1,
    frameTimer: 0,
    state: "idle",
    stateTimer: 3,
    hoverText: "บอร์ดบริหารความเสี่ยง (Stress Test & ค่าสหสัมพันธ์)"
  },
  {
    id: "risk_right",
    charId: 5,
    name: "ผู้ประเมินความเสี่ยง B",
    feature: "risk",
    x: 17 * TILE_SIZE + 8,
    y: 11 * TILE_SIZE + 8,
    dir: 0,
    frame: 1,
    frameTimer: 0,
    state: "idle",
    stateTimer: 4,
    hoverText: "บอร์ดบริหารความเสี่ยง (Stress Test & ค่าสหสัมพันธ์)"
  }
];

export const DESK_POSITIONS = [
  { x: 3 * TILE_SIZE, y: 3 * TILE_SIZE }, // CEO
  { x: 9 * TILE_SIZE, y: 3 * TILE_SIZE }, // Accountant
  { x: 2 * TILE_SIZE, y: 11 * TILE_SIZE }, // Receptionist
  { x: 9 * TILE_SIZE, y: 11 * TILE_SIZE } // Analyst
];
