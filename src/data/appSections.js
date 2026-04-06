import { buildSections } from "../constants/sections.js";
import { DATA_STRUCTURE_TREE } from "./dataStructuresTree.js";
import { ALGORITHM_TREE } from "./algorithmsTree.js";
import { PATTERN_TREE } from "./patternsTree.js";
import { MATH_TREE } from "./mathsTree.js";

export const SECTIONS = buildSections({
  dataStructuresTree: DATA_STRUCTURE_TREE,
  algorithmTree: ALGORITHM_TREE,
  patternTree: PATTERN_TREE,
  mathTree: MATH_TREE,
});
