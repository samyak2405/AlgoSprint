import React, { useCallback, useState } from "react";
import { DpInteractiveDemo } from "./DpInteractiveDemo";
import { PriorityQueueVisualizer } from "./PriorityQueueVisualizer";
import { SnippetControls } from "./SnippetControls";

function getProblemLadder(result) {
  const byName = {
    "Binary Search": {
      easy: ["Binary Search", "Search Insert Position"],
      medium: ["Find First and Last Position of Element in Sorted Array", "Search in Rotated Sorted Array"],
      hard: ["Median of Two Sorted Arrays", "Split Array Largest Sum"],
    },
    "Lower Bound / Upper Bound": {
      easy: ["Search Insert Position", "Sqrt(x)"],
      medium: ["Find First and Last Position of Element in Sorted Array", "Koko Eating Bananas"],
      hard: ["Capacity To Ship Packages Within D Days", "Minimum Number of Days to Make m Bouquets"],
    },
    "Search in Rotated Sorted Array": {
      easy: ["Search in Rotated Sorted Array"],
      medium: ["Find Minimum in Rotated Sorted Array", "Search in Rotated Sorted Array II"],
      hard: ["Find in Mountain Array", "Peak Index in a Mountain Array (binary pattern)"],
    },
    "ArrayList": {
      easy: ["Remove Duplicates from Sorted Array", "Merge Sorted Array"],
      medium: ["3Sum", "Container With Most Water"],
      hard: ["Trapping Rain Water", "First Missing Positive"],
    },
    HashMap: {
      easy: ["Two Sum", "Valid Anagram"],
      medium: ["Group Anagrams", "Subarray Sum Equals K"],
      hard: ["Minimum Window Substring", "Substring with Concatenation of All Words"],
    },
    TreeMap: {
      easy: ["Contains Duplicate III (ordered map approach)"],
      medium: ["Hand of Straights", "My Calendar I"],
      hard: ["The Skyline Problem", "Count of Range Sum"],
    },
    "Union-Find (DSU)": {
      easy: ["Find if Path Exists in Graph"],
      medium: ["Number of Provinces", "Redundant Connection"],
      hard: ["Redundant Connection II", "Most Stones Removed with Same Row or Column"],
    },
    "Fenwick Tree (BIT)": {
      easy: ["Range Sum Query - Mutable (BIT approach)"],
      medium: ["Count of Smaller Numbers After Self"],
      hard: ["Reverse Pairs", "Count of Range Sum"],
    },
    "Red-Black Tree (via TreeMap/TreeSet)": {
      easy: ["Contains Duplicate III (ordered set approach)"],
      medium: ["My Calendar I", "Hand of Straights"],
      hard: ["The Skyline Problem", "Count of Range Sum"],
    },
    "Segment Tree": {
      easy: ["Range Sum Query - Mutable"],
      medium: ["My Calendar I (segment idea variants)", "Range Sum Query 2D - Mutable"],
      hard: ["Falling Squares", "Count of Range Sum"],
    },
    "Sparse Table": {
      easy: ["Range Minimum Query (classic)"],
      medium: ["Largest Rectangle in Histogram (RMQ divide-and-conquer variant)", "Sum of Distances in Tree (preprocess/query mindset)"],
      hard: ["Static RMQ heavy query sets", "LCA with Binary Lifting/Sparse Table approach"],
    },
    "Deque / Monotonic Queue": {
      easy: ["Sliding Window Maximum"],
      medium: ["Longest Continuous Subarray With Absolute Diff <= Limit"],
      hard: ["Shortest Subarray with Sum at Least K", "Constrained Subsequence Sum"],
    },
    "Ordered Multiset (TreeMap)": {
      easy: ["Contains Duplicate III (ordered set/map approach)"],
      medium: ["Hand of Straights", "My Calendar I"],
      hard: ["The Skyline Problem", "Count of Range Sum"],
    },
    "Graph Representations": {
      easy: ["Find if Path Exists in Graph", "Find Center of Star Graph"],
      medium: ["Number of Provinces", "Course Schedule"],
      hard: ["Critical Connections in a Network", "Alien Dictionary"],
    },
    "Two Heaps (Median DS)": {
      easy: ["Find Median from Data Stream"],
      medium: ["Sliding Window Median", "IPO (heap discipline)"],
      hard: ["Median of Two Sorted Arrays (comparison topic)", "Minimum Cost to Hire K Workers (heap-heavy)"],
    },
    "Sliding Window Pattern": {
      easy: ["Maximum Average Subarray I"],
      medium: ["Longest Repeating Character Replacement", "Permutation in String"],
      hard: ["Minimum Window Substring", "Substring with Concatenation of All Words"],
    },
    "Sliding Window Variant: Fixed Size": {
      easy: ["Maximum Average Subarray I", "Defuse the Bomb"],
      medium: ["Sliding Window Maximum (fixed-width core idea)", "K Radius Subarray Averages"],
      hard: ["Constrained Subsequence Sum (windowed optimization)", "Shortest Subarray with Sum at Least K"],
    },
    "Sliding Window Variant: At Most K": {
      easy: ["Max Consecutive Ones III"],
      medium: ["Longest Substring with At Most K Distinct Characters", "Fruit Into Baskets"],
      hard: ["Subarrays with K Different Integers", "Count Vowel Substrings of a String"],
    },
    "Sliding Window Variant: Exactly K": {
      easy: ["Binary Subarrays With Sum"],
      medium: ["Subarrays with K Different Integers", "Count Number of Nice Subarrays"],
      hard: ["Number of Substrings Containing All Three Characters", "Shortest Subarray with Sum at Least K"],
    },
    "Sliding Window Variant: Frequency Match": {
      easy: ["Find All Anagrams in a String"],
      medium: ["Permutation in String", "Minimum Window Substring"],
      hard: ["Substring with Concatenation of All Words", "Count Substrings That Satisfy K-Constraint II"],
    },
    "Sliding Window Variant: Monotonic Deque": {
      easy: ["Sliding Window Maximum"],
      medium: ["Longest Continuous Subarray With Absolute Diff <= Limit"],
      hard: ["Shortest Subarray with Sum at Least K", "Constrained Subsequence Sum"],
    },
    "Two Pointers Pattern": {
      easy: ["Valid Palindrome", "Move Zeroes"],
      medium: ["3Sum", "Container With Most Water"],
      hard: ["Trapping Rain Water", "Shortest Palindrome (two-pointer + hashing variants)"],
    },
    "Two Pointers Variant: Opposite Ends": {
      easy: ["Two Sum II - Input Array Is Sorted", "Valid Palindrome"],
      medium: ["Container With Most Water", "3Sum"],
      hard: ["Trapping Rain Water", "4Sum"],
    },
    "Two Pointers Variant: Fast/Slow": {
      easy: ["Middle of the Linked List", "Linked List Cycle"],
      medium: ["Linked List Cycle II", "Remove Duplicates from Sorted Array II"],
      hard: ["Palindrome Linked List (O(1) space)", "Reorder List"],
    },
    "Two Pointers Variant: Partitioning": {
      easy: ["Sort Colors"],
      medium: ["Partition Labels (related partition intuition)", "Wiggle Sort II"],
      hard: ["First Missing Positive (in-place partitioning flavor)", "Sort an Array by Parity II"],
    },
    "Two Pointers Variant: Merge / Intersection": {
      easy: ["Merge Sorted Array", "Intersection of Two Arrays II"],
      medium: ["Interval List Intersections", "Merge Intervals"],
      hard: ["Median of Two Sorted Arrays", "Minimum Number of Arrows to Burst Balloons"],
    },
    "Two Pointers Variant: K-Sum Reduction": {
      easy: ["Two Sum II - Input Array Is Sorted"],
      medium: ["3Sum", "3Sum Closest"],
      hard: ["4Sum", "K-th Smallest Pair Distance"],
    },
    "Graph Variant: DFS Components": {
      easy: ["Find if Path Exists in Graph", "Number of Provinces"],
      medium: ["Number of Islands", "Max Area of Island"],
      hard: ["Critical Connections in a Network", "Number of Good Paths"],
    },
    "Graph Variant: Multi-Source BFS": {
      easy: ["01 Matrix"],
      medium: ["Rotting Oranges", "Walls and Gates"],
      hard: ["Shortest Path to Get All Keys", "Escape the Spreading Fire"],
    },
    "Graph Variant: Kahn Topological BFS": {
      easy: ["Find All Possible Recipes from Given Supplies"],
      medium: ["Course Schedule", "Course Schedule II"],
      hard: ["Alien Dictionary", "Parallel Courses III"],
    },
    "Graph Variant: DFS Directed Cycle": {
      easy: ["Find if Path Exists in Graph (cycle basics)"],
      medium: ["Course Schedule", "Find Eventual Safe States"],
      hard: ["Longest Cycle in a Graph", "Critical Connections in a Network"],
    },
    "Graph Variant: Bipartite BFS Coloring": {
      easy: ["Is Graph Bipartite?"],
      medium: ["Possible Bipartition", "Course Schedule IV (related graph constraints)"],
      hard: ["Divide Nodes Into the Maximum Number of Groups", "Shortest Path Visiting All Nodes"],
    },
    "Graph Variant: 0-1 BFS": {
      easy: ["Minimum Cost to Make at Least One Valid Path in a Grid"],
      medium: ["Shortest Path in Binary Matrix (BFS baseline)", "Network Delay Time (contrast with Dijkstra)"],
      hard: ["Minimum Obstacle Removal to Reach Corner", "Modify Graph Edge Weights"],
    },
    "Graph Variant: Grid Flood Fill": {
      easy: ["Flood Fill", "Number of Islands"],
      medium: ["Surrounded Regions", "Max Area of Island"],
      hard: ["Shortest Bridge", "Pacific Atlantic Water Flow"],
    },
    "DP Variation: State Design - Index i": {
      easy: ["Climbing Stairs", "Min Cost Climbing Stairs"],
      medium: ["House Robber", "Decode Ways"],
      hard: ["Jump Game VI", "Integer Break"],
    },
    "DP Variation: State Design - Pair (i,j)": {
      easy: ["Longest Common Prefix (warmup)"],
      medium: ["Longest Common Subsequence", "Edit Distance"],
      hard: ["Distinct Subsequences", "Regular Expression Matching"],
    },
    "DP Variation: State Design - Position + Capacity": {
      easy: ["Partition Equal Subset Sum"],
      medium: ["Coin Change", "Target Sum"],
      hard: ["Ones and Zeroes", "Profitable Schemes"],
    },
    "DP Variation: State Design - Index + Sum": {
      easy: ["Target Sum (small constraints)"],
      medium: ["Partition Equal Subset Sum", "Combination Sum IV"],
      hard: ["Count of Range Sum", "Number of Ways to Reach a Position After Exactly K Steps"],
    },
    "DP Variation: State Design - Interval (l,r)": {
      easy: ["Predict the Winner (interval DP intro)"],
      medium: ["Minimum Score Triangulation of Polygon", "Longest Palindromic Subsequence"],
      hard: ["Burst Balloons", "Palindrome Partitioning II"],
    },
    "DP Variation: State Design - Tree Node": {
      easy: ["Diameter of Binary Tree (tree DP intro)"],
      medium: ["House Robber III", "Binary Tree Maximum Path Sum"],
      hard: ["Sum of Distances in Tree", "Minimum Edge Reversals So Every Node Is Reachable"],
    },
    "DP Variation: State Design - Bitmask + Last": {
      easy: ["Beautiful Arrangement (mask DP intro)"],
      medium: ["Shortest Path Visiting All Nodes", "Maximum Students Taking Exam"],
      hard: ["Minimum Cost to Connect Two Groups of Points", "Parallel Courses II"],
    },
    "DP Variation: State Design - Digit": {
      easy: ["Count Integers With Even Digit Sum"],
      medium: ["Count Special Integers", "Numbers With Repeated Digits"],
      hard: ["Count of Integers", "Number of Beautiful Integers in the Range"],
    },
    "DP Variation: State Design - DAG Node": {
      easy: ["Find Eventual Safe States (DAG intuition)"],
      medium: ["Longest Increasing Path in a Matrix", "Course Schedule"],
      hard: ["Largest Color Value in a Directed Graph", "Parallel Courses III"],
    },
    "DP Variation: State Design - Finite State Machine": {
      easy: ["Best Time to Buy and Sell Stock"],
      medium: ["Best Time to Buy and Sell Stock with Cooldown", "Best Time to Buy and Sell Stock II"],
      hard: ["Best Time to Buy and Sell Stock III", "Best Time to Buy and Sell Stock IV"],
    },
    "Bit Manipulation Cheatsheet": {
      easy: ["Single Number", "Number of 1 Bits"],
      medium: ["Counting Bits", "Bitwise AND of Numbers Range"],
      hard: ["Maximum XOR of Two Numbers in an Array", "Minimum One Bit Operations to Make Integers Zero"],
    },
    "GCD and LCM": {
      easy: ["Find Greatest Common Divisor of Array"],
      medium: ["Fraction Addition and Subtraction", "Nth Magical Number"],
      hard: ["Ugly Number III", "K-th Smallest Prime Fraction"],
    },
    "Dynamic Programming (Top-down Memoization)": {
      easy: ["Climbing Stairs", "Min Cost Climbing Stairs"],
      medium: ["Coin Change", "Longest Increasing Subsequence"],
      hard: ["Edit Distance", "Burst Balloons"],
    },
  };

  if (byName[result.name]) return byName[result.name];

  const pkg = (result.pkg || "").toLowerCase();
  if (pkg.includes("graph")) {
    return {
      easy: ["Flood Fill", "Find if Path Exists in Graph"],
      medium: ["Number of Islands", "Course Schedule"],
      hard: ["Word Ladder", "Alien Dictionary"],
    };
  }
  if (pkg.includes("dp")) {
    return {
      easy: ["Climbing Stairs", "House Robber"],
      medium: ["Coin Change", "Longest Common Subsequence"],
      hard: ["Distinct Subsequences", "Regular Expression Matching"],
    };
  }
  if (pkg.includes("pattern") || pkg.includes("search")) {
    return {
      easy: ["Implement strStr()", "Search Insert Position"],
      medium: ["Koko Eating Bananas", "Find First and Last Position of Element in Sorted Array"],
      hard: ["Split Array Largest Sum", "Median of Two Sorted Arrays"],
    };
  }

  return {
    easy: ["Two Sum", "Valid Parentheses"],
    medium: ["Top K Frequent Elements", "Longest Substring Without Repeating Characters"],
    hard: ["Trapping Rain Water", "LFU Cache"],
  };
}

export function ResultCard({ result, onReset, getCodeVariants, renderHighlightedCode, dpSteps, wrapCode, onToggleWrap }) {
  const variants = getCodeVariants(result);
  const [activeVariant, setActiveVariant] = useState(0);
  const [copyLabel, setCopyLabel] = useState("Copy code");
  const currentCode = variants[Math.min(activeVariant, variants.length - 1)].code;
  const isDpVariantTabs = result.name.startsWith("DP Variation:");
  const ladder = getProblemLadder(result);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopyLabel("Copied");
      setTimeout(() => setCopyLabel("Copy code"), 1200);
    } catch {
      setCopyLabel("Copy failed");
      setTimeout(() => setCopyLabel("Copy code"), 1200);
    }
  }, [currentCode]);

  return (
    <div className="result-card" style={{ borderColor: `${result.color}60` }}>
      <span className="result-pill" style={{ background: result.color }}>
        Recommendation
      </span>
      <h2>{result.name}</h2>
      <p className="pkg">{result.pkg}</p>
      <p>
        <strong>When to use:</strong> {result.whenToUse}
      </p>
      <p>
        <strong>Why this choice:</strong> {result.why}
      </p>
      <div className="perf-grid">
        {Object.entries(result.complexity).map(([k, v]) => (
          <div key={k} className="perf-chip">
            <span>{k}:</span> <strong>{v}</strong>
          </div>
        ))}
      </div>
      <p>
        <strong>Pitfalls/alternatives:</strong> {result.tradeoffs}
      </p>
      <div className="code-header">
        <h3>Java code</h3>
        <button className="copy-btn" onClick={handleCopy}>
          {copyLabel}
        </button>
      </div>
      {variants.length > 1 && (
        <>
          <div className="code-variant-tabs">
            {variants.map((variant, idx) => (
              <button
                key={variant.title}
                className={`code-tab ${idx === activeVariant ? "active" : ""}`}
                onClick={() => setActiveVariant(idx)}
              >
                {variant.title}
              </button>
            ))}
          </div>
          {isDpVariantTabs ? (
            <p className="code-helper">
              Order: Recursive (plain) {"->"} Memoized recursion (top-down) {"->"} Iterative DP (bottom-up).
            </p>
          ) : null}
        </>
      )}
      <SnippetControls wrapCode={wrapCode} onToggleWrap={onToggleWrap} />
      <pre className={`java-block ${wrapCode ? "wrap" : ""}`}>{renderHighlightedCode(currentCode)}</pre>
      <div className="problem-ladder">
        <h3>Must Solve Problem Ladder</h3>
        <div className="problem-ladder-row">
          <div className="problem-tier">
            <span className="problem-tier-badge easy">Easy</span>
            <ul>
              {ladder.easy.map((q) => (
                <li key={`easy-${q}`}>{q}</li>
              ))}
            </ul>
          </div>
          <div className="problem-tier">
            <span className="problem-tier-badge medium">Medium</span>
            <ul>
              {ladder.medium.map((q) => (
                <li key={`med-${q}`}>{q}</li>
              ))}
            </ul>
          </div>
          <div className="problem-tier">
            <span className="problem-tier-badge hard">Hard</span>
            <ul>
              {ladder.hard.map((q) => (
                <li key={`hard-${q}`}>{q}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {result.interactiveKey ? <DpInteractiveDemo demoKey={result.interactiveKey} stepsMap={dpSteps} /> : null}
      {result.name === "PriorityQueue" ? <PriorityQueueVisualizer /> : null}
      <button className="ghost-btn center-btn" onClick={onReset}>
        Start over
      </button>
    </div>
  );
}
