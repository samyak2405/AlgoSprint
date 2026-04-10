export const DP_INTERACTIVE_STEPS = {
  linear1d: [
    { title: "Input", note: "n = 6 (climb stairs)", view: "dp[1]=1, dp[2]=2" },
    { title: "i = 3", note: "dp[3] = dp[2] + dp[1] = 3", view: "[1,2,3]" },
    { title: "i = 4", note: "dp[4] = 5", view: "[1,2,3,5]" },
    { title: "i = 5", note: "dp[5] = 8", view: "[1,2,3,5,8]" },
    { title: "i = 6", note: "dp[6] = 13", view: "[1,2,3,5,8,13]" },
  ],
  grid2d: [
    { title: "Grid", note: "Costs", view: "1 3 1\n1 5 1\n4 2 1" },
    { title: "Init first row/col", note: "Only one path to these cells", view: "1 4 5\n2 . .\n6 . ." },
    { title: "Fill (1,1), (1,2)", note: "min(top,left)+cost", view: "1 4 5\n2 7 6\n6 . ." },
    { title: "Fill last row", note: "Continue same transition", view: "1 4 5\n2 7 6\n6 8 7" },
    { title: "Answer", note: "dp[2][2] = 7", view: "Minimum path sum is 7" },
  ],
  knapsack: [
    { title: "Items", note: "wt=[1,3,4], val=[15,20,30], cap=4", view: "Start dp=[0,0,0,0,0]" },
    { title: "After item (1,15)", note: "Reverse iterate cap", view: "[0,15,15,15,15]" },
    { title: "After item (3,20)", note: "Update dp[3],dp[4]", view: "[0,15,15,20,35]" },
    { title: "After item (4,30)", note: "Compare with existing best", view: "[0,15,15,20,35]" },
    { title: "Answer", note: "Best value at cap=4", view: "35" },
  ],
  lcs: [
    { title: "Strings", note: "a = \"abcde\", b = \"ace\"", view: "DP size = 6 x 4" },
    { title: "Match a", note: "a == a -> dp[1][1]=1", view: "1 . .\n. . .\n. . ." },
    { title: "Match c", note: "c == c -> carry +1", view: "1 . .\n1 1 .\n1 2 ." },
    { title: "Match e", note: "e == e -> final growth", view: "...\n...\n1 2 3" },
    { title: "Answer", note: "LCS length = 3", view: "\"ace\"" },
  ],
};
