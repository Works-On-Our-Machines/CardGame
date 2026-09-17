export const MAP_CONFIG = {
  totalFloors: 15,
  minNodesPerRow: 2,
  maxNodesPerRow: 5,
  maxOutgoingPaths: 3,

  fixedNodeCounts: {
    0: 1,
    7: 4,
    15: 1,
  },

  guaranteedRows: {
    0: ["startingArea"],
    1: ["combat", "event"],
    2: ["combat", "event"],
    3: ["combat", "event"],
    7: ["rest"],
    14: ["rest"],
    15: ["boss"],
  },

  typeRestrictions: {
    maxEliteNodes: 5,
    minEliteNodes: 3,
    firstPossibleEliteFloor: 4,

    maxRestAreas: 6,
    minRestAreas: 3,
    firstPossibleRestFloor: 4,

    maxShops: 5,
    minShops: 3,

    easyFightFloors: 3,
  },

  nodeWeights: {
    combat: 40,
    event: 25,
    elite: 15,
    rest: 10,
    shop: 10,
  },

  preventConsecutive: ["elite", "rest", "shop"],
};
