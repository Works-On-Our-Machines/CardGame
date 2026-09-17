const MOCK_MAP = [
  {
    row: 0,
    nodes: [
      {
        id: "0_0",
        type: "startingArea",
        status: "completed",
        connections: ["1_0", "1_1"],
      },
    ],
  },
  {
    row: 1,
    nodes: [
      { id: "1_0", type: "combat", status: "available", connections: ["2_0"] },
      { id: "1_1", type: "event", status: "available", connections: ["2_1"] },
    ],
  },
  {
    row: 2,
    nodes: [
      { id: "2_0", type: "rest", status: "locked", connections: ["3_0"] },
      { id: "2_1", type: "shop", status: "locked", connections: ["3_0"] },
    ],
  },
  {
    row: 3,
    nodes: [{ id: "3_0", type: "boss", status: "locked", connections: [] }],
  },
];