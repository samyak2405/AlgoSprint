import React, { useCallback, useState } from "react";
import { DpInteractiveDemo } from "./DpInteractiveDemo";
import { ArrayVisualizer } from "./ArrayVisualizer";
import { StackVisualizer } from "./StackVisualizer";
import { QueueVisualizer } from "./QueueVisualizer";
import { LinkedListVisualizer } from "./LinkedListVisualizer";
import { BSTVisualizer } from "./BSTVisualizer";
import { DequeVisualizer } from "./DequeVisualizer";
import { TrieVisualizer } from "./TrieVisualizer";
import { UnionFindVisualizer } from "./UnionFindVisualizer";
import { FenwickTreeVisualizer } from "./FenwickTreeVisualizer";
import { SegmentTreeVisualizer } from "./SegmentTreeVisualizer";
import { SparseTableVisualizer } from "./SparseTableVisualizer";
import { TwoHeapsVisualizer } from "./TwoHeapsVisualizer";
import { HashMapVisualizer } from "./HashMapVisualizer";
import { PriorityQueueVisualizer } from "./PriorityQueueVisualizer";
import { RedBlackTreeVisualizer } from "./RedBlackTreeVisualizer";

function getProblemLadder(result) {
  const byName = {
    // ── Data Structures ─────────────────────────────────────
    "ArrayList": {
      easy: ["Remove Duplicates from Sorted Array", "Merge Sorted Array", "Running Sum of 1d Array"],
      medium: ["3Sum", "Product of Array Except Self", "Rotate Array"],
      hard: ["Trapping Rain Water", "First Missing Positive", "Sliding Window Maximum"],
    },
    "LinkedList (Deque API)": {
      easy: ["Reverse Linked List", "Merge Two Sorted Lists", "Linked List Cycle"],
      medium: ["Remove Nth Node From End of List", "Reorder List", "LRU Cache"],
      hard: ["Merge k Sorted Lists", "Reverse Nodes in k-Group", "Sort List"],
    },
    "Array (int[] / T[])": {
      easy: ["Best Time to Buy and Sell Stock", "Contains Duplicate", "Find Pivot Index"],
      medium: ["Jump Game", "Product of Array Except Self", "Rotate Array"],
      hard: ["First Missing Positive", "Maximum Gap", "Count of Smaller Numbers After Self"],
    },
    "HashMap": {
      easy: ["Two Sum", "Valid Anagram", "Ransom Note"],
      medium: ["Group Anagrams", "Subarray Sum Equals K", "Longest Consecutive Sequence"],
      hard: ["Minimum Window Substring", "Substring with Concatenation of All Words", "LFU Cache"],
    },
    "LinkedHashMap": {
      easy: ["Two Sum", "Contains Duplicate"],
      medium: ["LRU Cache", "Insert Delete GetRandom O(1)"],
      hard: ["LFU Cache", "All O'one Data Structure"],
    },
    "TreeMap": {
      easy: ["Contains Duplicate III"],
      medium: ["Hand of Straights", "My Calendar I", "Time Based Key-Value Store"],
      hard: ["The Skyline Problem", "Count of Range Sum", "Data Stream as Disjoint Intervals"],
    },
    "HashSet": {
      easy: ["Contains Duplicate", "Happy Number", "Intersection of Two Arrays"],
      medium: ["Longest Consecutive Sequence", "Set Matrix Zeroes", "Word Pattern"],
      hard: ["Word Ladder", "Brick Wall"],
    },
    "LinkedHashSet": {
      easy: ["Contains Duplicate", "Intersection of Two Arrays"],
      medium: ["Insert Delete GetRandom O(1)", "LRU Cache"],
      hard: ["LFU Cache", "All O'one Data Structure"],
    },
    "TreeSet": {
      easy: ["Contains Duplicate III"],
      medium: ["My Calendar I", "Kth Largest Element in a Stream"],
      hard: ["The Skyline Problem", "Count of Range Sum"],
    },
    "Stack": {
      easy: ["Valid Parentheses", "Min Stack", "Implement Queue using Stacks"],
      medium: ["Daily Temperatures", "Evaluate Reverse Polish Notation", "Decode String"],
      hard: ["Largest Rectangle in Histogram", "Basic Calculator", "Maximal Rectangle"],
    },
    "Queue": {
      easy: ["Implement Stack using Queues", "Number of Recent Calls"],
      medium: ["Design Circular Queue", "Walls and Gates", "Open the Lock"],
      hard: ["Sliding Window Maximum", "Jump Game VI"],
    },
    "PriorityQueue": {
      easy: ["Kth Largest Element in a Stream", "Last Stone Weight"],
      medium: ["Kth Largest Element in an Array", "Top K Frequent Elements", "Task Scheduler"],
      hard: ["Find Median from Data Stream", "IPO", "Minimum Cost to Hire K Workers"],
    },
    "Trie": {
      easy: ["Implement Trie (Prefix Tree)", "Longest Common Prefix"],
      medium: ["Design Add and Search Words Data Structure", "Word Search II (trie approach)", "Replace Words"],
      hard: ["Word Search II", "Maximum XOR of Two Numbers in an Array", "Palindrome Pairs"],
    },
    "Red-Black Tree (via TreeMap/TreeSet)": {
      easy: ["Contains Duplicate III"],
      medium: ["My Calendar I", "Hand of Straights", "Time Based Key-Value Store"],
      hard: ["The Skyline Problem", "Count of Range Sum", "Data Stream as Disjoint Intervals"],
    },
    "Union-Find (Disjoint Set Union)": {
      easy: ["Find if Path Exists in Graph"],
      medium: ["Number of Provinces", "Redundant Connection", "Accounts Merge"],
      hard: ["Redundant Connection II", "Smallest String With Swaps", "Minimize Malware Spread"],
    },
    "Union-Find (DSU)": {
      easy: ["Find if Path Exists in Graph"],
      medium: ["Number of Provinces", "Redundant Connection", "Accounts Merge"],
      hard: ["Redundant Connection II", "Smallest String With Swaps", "Minimize Malware Spread"],
    },
    "Fenwick Tree (BIT)": {
      easy: ["Range Sum Query - Immutable"],
      medium: ["Range Sum Query - Mutable", "Count of Smaller Numbers After Self"],
      hard: ["Reverse Pairs", "Count of Range Sum", "Number of Longest Increasing Subsequence"],
    },
    "Segment Tree": {
      easy: ["Range Sum Query - Mutable"],
      medium: ["Range Sum Query 2D - Mutable", "My Calendar I"],
      hard: ["Falling Squares", "Count of Range Sum", "The Skyline Problem"],
    },
    "Sparse Table": {
      easy: ["Range Minimum Query (classic RMQ)"],
      medium: ["Largest Rectangle in Histogram", "Sum of Distances in Tree"],
      hard: ["Maximum of Absolute Value Expression", "LCA with Binary Lifting"],
    },
    "Deque / Monotonic Queue": {
      easy: ["Moving Average from Data Stream"],
      medium: ["Sliding Window Maximum", "Longest Continuous Subarray With Absolute Diff <= Limit"],
      hard: ["Shortest Subarray with Sum at Least K", "Constrained Subsequence Sum"],
    },
    "Ordered Multiset (TreeMap)": {
      easy: ["Contains Duplicate III"],
      medium: ["Hand of Straights", "My Calendar I"],
      hard: ["The Skyline Problem", "Count of Range Sum"],
    },
    "Graph Representations": {
      easy: ["Find if Path Exists in Graph", "Find Center of Star Graph"],
      medium: ["Number of Provinces", "Course Schedule", "Clone Graph"],
      hard: ["Critical Connections in a Network", "Alien Dictionary"],
    },
    "Two Heaps (Median DS)": {
      easy: ["Kth Largest Element in a Stream"],
      medium: ["Kth Largest Element in an Array", "IPO"],
      hard: ["Find Median from Data Stream", "Sliding Window Median", "Minimum Cost to Hire K Workers"],
    },
    "ConcurrentHashMap": {
      easy: ["Two Sum", "Contains Duplicate"],
      medium: ["LRU Cache", "Design HashMap"],
      hard: ["LFU Cache", "All O'one Data Structure"],
    },

    // ── Algorithms ───────────────────────────────────────────
    "Binary Search": {
      easy: ["Binary Search", "Search Insert Position", "Guess Number Higher or Lower"],
      medium: ["Find First and Last Position of Element in Sorted Array", "Koko Eating Bananas", "Search a 2D Matrix"],
      hard: ["Median of Two Sorted Arrays", "Split Array Largest Sum", "Find in Mountain Array"],
    },
    "Lower Bound / Upper Bound": {
      easy: ["Search Insert Position", "Sqrt(x)"],
      medium: ["Find First and Last Position of Element in Sorted Array", "Koko Eating Bananas", "Magnetic Force Between Two Balls"],
      hard: ["Capacity To Ship Packages Within D Days", "Minimum Number of Days to Make m Bouquets"],
    },
    "Search in Rotated Sorted Array": {
      easy: ["Binary Search"],
      medium: ["Search in Rotated Sorted Array", "Find Minimum in Rotated Sorted Array", "Search in Rotated Sorted Array II"],
      hard: ["Find in Mountain Array", "Search in Rotated Sorted Array II (duplicates)"],
    },
    "Peak Element Binary Search": {
      easy: ["Peak Index in a Mountain Array"],
      medium: ["Find Peak Element", "Find a Peak Element II"],
      hard: ["Find in Mountain Array", "Minimize the Maximum Difference of Pairs"],
    },
    "Binary Search on Answer": {
      easy: ["Guess Number Higher or Lower"],
      medium: ["Koko Eating Bananas", "Minimum Speed to Arrive on Time", "Magnetic Force Between Two Balls"],
      hard: ["Split Array Largest Sum", "Capacity To Ship Packages Within D Days", "Minimum Number of Days to Make m Bouquets"],
    },
    "Linear Search": {
      easy: ["Find the Index of the First Occurrence in a String", "Search in a Binary Search Tree"],
      medium: ["Find Minimum in Rotated Sorted Array"],
      hard: ["Find in Mountain Array"],
    },
    "Quick Sort": {
      easy: ["Sort an Array (as warm-up)", "Kth Largest Element in an Array"],
      medium: ["Sort Colors", "Wiggle Sort II", "Sort List"],
      hard: ["Find the Kth Largest Integer in the Array", "K-th Smallest Prime Fraction"],
    },
    "Merge Sort": {
      easy: ["Merge Sorted Array", "Sort an Array"],
      medium: ["Sort List", "Merge Intervals", "Count of Range Sum"],
      hard: ["Count of Smaller Numbers After Self", "Reverse Pairs", "Merge k Sorted Lists"],
    },
    "Insertion Sort": {
      easy: ["Insertion Sort List", "Sort an Array"],
      medium: ["Sort List"],
      hard: ["Count of Smaller Numbers After Self"],
    },
    "Counting Sort": {
      easy: ["Sort Colors", "Relative Sort Array"],
      medium: ["Maximum Gap", "Sort Characters By Frequency"],
      hard: ["Find Duplicate File in System", "Maximum Gap (radix variant)"],
    },
    "BFS": {
      easy: ["Binary Tree Level Order Traversal", "Flood Fill", "Number of Islands"],
      medium: ["Word Ladder", "Rotting Oranges", "Shortest Path in Binary Matrix"],
      hard: ["Shortest Path to Get All Keys", "Jump Game IV", "Word Ladder II"],
    },
    "Dijkstra": {
      easy: ["Network Delay Time (starter)"],
      medium: ["Network Delay Time", "Path With Minimum Effort", "Cheapest Flights Within K Stops"],
      hard: ["Swim in Rising Water", "Minimum Cost to Reach City With Discounts", "Find the City With the Smallest Number of Neighbors"],
    },
    "Bellman-Ford": {
      easy: ["Network Delay Time (Bellman-Ford variant)"],
      medium: ["Cheapest Flights Within K Stops", "Find the City With the Smallest Number of Neighbors"],
      hard: ["Minimum Cost to Reach Destination in Time", "Minimum Number of Days to Disconnect Island"],
    },
    "KMP (Knuth-Morris-Pratt)": {
      easy: ["Find the Index of the First Occurrence in a String"],
      medium: ["Implement strStr()", "Repeated Substring Pattern", "Shortest Palindrome"],
      hard: ["Shortest Palindrome", "String Matching in an Array"],
    },

    // ── DP Variations (from Algorithm tree) ─────────────────
    "Dynamic Programming (Top-down Memoization)": {
      easy: ["Climbing Stairs", "Min Cost Climbing Stairs"],
      medium: ["Coin Change", "Longest Increasing Subsequence", "House Robber"],
      hard: ["Edit Distance", "Burst Balloons", "Distinct Subsequences"],
    },
    "DP Variation: 1D Linear DP": {
      easy: ["Climbing Stairs", "Min Cost Climbing Stairs"],
      medium: ["House Robber", "Jump Game II", "Decode Ways"],
      hard: ["Jump Game VI", "Minimum Cost For Tickets", "Integer Break"],
    },
    "DP Variation: 2D Grid DP": {
      easy: ["Pascal's Triangle", "Unique Paths"],
      medium: ["Unique Paths II", "Minimum Path Sum", "Triangle"],
      hard: ["Dungeon Game", "Cherry Pickup", "Minimum Falling Path Sum II"],
    },
    "DP Variation: Subsequence (i,j) DP": {
      easy: ["Longest Common Prefix (warmup)"],
      medium: ["Longest Common Subsequence", "Edit Distance", "Uncrossed Lines"],
      hard: ["Distinct Subsequences", "Regular Expression Matching", "Interleaving String"],
    },
    "DP Variation: Knapsack Family": {
      easy: ["Partition Equal Subset Sum"],
      medium: ["Coin Change", "Target Sum", "Last Stone Weight II"],
      hard: ["Ones and Zeroes", "Profitable Schemes", "Number of Ways to Earn Points"],
    },
    "DP Variation: Partition DP": {
      easy: ["Palindrome Partitioning"],
      medium: ["Palindrome Partitioning II", "Decode Ways", "Word Break"],
      hard: ["Burst Balloons", "Strange Printer", "Minimum Cost to Cut a Stick"],
    },
    "DP Variation: Interval [l,r] DP": {
      easy: ["Predict the Winner"],
      medium: ["Minimum Score Triangulation of Polygon", "Longest Palindromic Subsequence"],
      hard: ["Burst Balloons", "Palindrome Partitioning II", "Strange Printer"],
    },
    "DP Variation: LIS and Chains": {
      easy: ["Longest Increasing Subsequence (O(n²) warmup)"],
      medium: ["Longest Increasing Subsequence", "Number of Longest Increasing Subsequence", "Russian Doll Envelopes"],
      hard: ["Russian Doll Envelopes", "Maximum Height by Stacking Cuboids"],
    },
    "DP Variation: Bitmask DP": {
      easy: ["Beautiful Arrangement"],
      medium: ["Shortest Path Visiting All Nodes", "Maximum Students Taking Exam"],
      hard: ["Minimum Cost to Connect Two Groups of Points", "Parallel Courses II", "Number of Ways to Wear Different Hats to Each Other"],
    },
    "DP Variation: Digit DP": {
      easy: ["Count Integers With Even Digit Sum"],
      medium: ["Count Special Integers", "Numbers With Repeated Digits"],
      hard: ["Count of Integers", "Number of Beautiful Integers in the Range", "Digit Count in Range"],
    },
    "DP Variation: Tree DP": {
      easy: ["Diameter of Binary Tree"],
      medium: ["House Robber III", "Binary Tree Maximum Path Sum"],
      hard: ["Sum of Distances in Tree", "Binary Tree Cameras", "Minimum Edge Reversals So Every Node Is Reachable"],
    },
    "DP Variation: Rerooting": {
      easy: ["Diameter of Binary Tree"],
      medium: ["Sum of Distances in Tree", "Count Nodes Equal to Average of Subtree"],
      hard: ["Sum of Distances in Tree", "Minimum Edge Reversals So Every Node Is Reachable"],
    },
    "DP Variation: DAG Topological DP": {
      easy: ["Find Eventual Safe States"],
      medium: ["Longest Increasing Path in a Matrix", "Course Schedule II"],
      hard: ["Largest Color Value in a Directed Graph", "Parallel Courses III", "Minimum Time to Complete All Tasks"],
    },
    "DP Variation: State Machine": {
      easy: ["Best Time to Buy and Sell Stock"],
      medium: ["Best Time to Buy and Sell Stock with Cooldown", "Best Time to Buy and Sell Stock II"],
      hard: ["Best Time to Buy and Sell Stock III", "Best Time to Buy and Sell Stock IV"],
    },
    "DP Variation: Probability / Expectation DP": {
      easy: ["New 21 Game"],
      medium: ["Soup Servings", "Knight Probability in Chessboard"],
      hard: ["Minimum Expected Value for Coin Flip Sequence", "Cat and Mouse"],
    },
    "DP Variation: Game DP": {
      easy: ["Predict the Winner"],
      medium: ["Stone Game", "Stone Game II"],
      hard: ["Stone Game IV", "Cat and Mouse", "Stone Game VII"],
    },
    "DP Variation: Optimized Transitions": {
      easy: ["Min Cost Climbing Stairs"],
      medium: ["Jump Game II", "Minimum Cost For Tickets"],
      hard: ["Jump Game VI", "Constrained Subsequence Sum", "Minimum Number of Removals to Make Mountain Array"],
    },
    "DP Variation: Design Checklist": {
      easy: ["Climbing Stairs", "Min Cost Climbing Stairs"],
      medium: ["Coin Change", "House Robber", "Longest Common Subsequence"],
      hard: ["Burst Balloons", "Edit Distance", "Regular Expression Matching"],
    },

    // ── DP State Design (from Data Structures / Algorithm section) ─
    "DP Variation: State Design - Index i": {
      easy: ["Climbing Stairs", "Min Cost Climbing Stairs"],
      medium: ["House Robber", "Decode Ways", "Jump Game II"],
      hard: ["Jump Game VI", "Integer Break", "Minimum Cost For Tickets"],
    },
    "DP Variation: State Design - Pair (i,j)": {
      easy: ["Longest Common Subsequence (warmup)"],
      medium: ["Longest Common Subsequence", "Edit Distance", "Uncrossed Lines"],
      hard: ["Distinct Subsequences", "Regular Expression Matching", "Interleaving String"],
    },
    "DP Variation: State Design - Position + Capacity": {
      easy: ["Partition Equal Subset Sum"],
      medium: ["Coin Change", "Target Sum", "Last Stone Weight II"],
      hard: ["Ones and Zeroes", "Profitable Schemes", "Number of Ways to Earn Points"],
    },
    "DP Variation: State Design - Index + Sum": {
      easy: ["Find Target Indices After Sorting Array"],
      medium: ["Partition Equal Subset Sum", "Combination Sum IV", "Count Ways to Build Good Strings"],
      hard: ["Count of Range Sum", "Profitable Schemes"],
    },
    "DP Variation: State Design - Interval (l,r)": {
      easy: ["Predict the Winner"],
      medium: ["Minimum Score Triangulation of Polygon", "Longest Palindromic Subsequence"],
      hard: ["Burst Balloons", "Palindrome Partitioning II", "Strange Printer"],
    },
    "DP Variation: State Design - Tree Node": {
      easy: ["Diameter of Binary Tree"],
      medium: ["House Robber III", "Binary Tree Maximum Path Sum"],
      hard: ["Sum of Distances in Tree", "Binary Tree Cameras", "Minimum Edge Reversals So Every Node Is Reachable"],
    },
    "DP Variation: State Design - Bitmask + Last": {
      easy: ["Beautiful Arrangement"],
      medium: ["Shortest Path Visiting All Nodes", "Maximum Students Taking Exam"],
      hard: ["Minimum Cost to Connect Two Groups of Points", "Parallel Courses II"],
    },
    "DP Variation: State Design - Digit": {
      easy: ["Count Integers With Even Digit Sum"],
      medium: ["Count Special Integers", "Numbers With Repeated Digits"],
      hard: ["Count of Integers", "Number of Beautiful Integers in the Range"],
    },
    "DP Variation: State Design - DAG Node": {
      easy: ["Find Eventual Safe States"],
      medium: ["Longest Increasing Path in a Matrix", "Course Schedule II"],
      hard: ["Largest Color Value in a Directed Graph", "Parallel Courses III"],
    },
    "DP Variation: State Design - Finite State Machine": {
      easy: ["Best Time to Buy and Sell Stock"],
      medium: ["Best Time to Buy and Sell Stock with Cooldown", "Best Time to Buy and Sell Stock II"],
      hard: ["Best Time to Buy and Sell Stock III", "Best Time to Buy and Sell Stock IV"],
    },

    // ── Patterns ─────────────────────────────────────────────
    "Sliding Window Pattern": {
      easy: ["Maximum Average Subarray I", "Minimum Recolors to Get K Consecutive Black Blocks"],
      medium: ["Longest Substring Without Repeating Characters", "Longest Repeating Character Replacement", "Permutation in String"],
      hard: ["Minimum Window Substring", "Sliding Window Maximum", "Substring with Concatenation of All Words"],
    },
    "Sliding Window Variant: Fixed Size": {
      easy: ["Maximum Average Subarray I", "Defuse the Bomb"],
      medium: ["Maximum Sum of Almost Unique Subarray", "K Radius Subarray Averages"],
      hard: ["Sliding Window Maximum", "Constrained Subsequence Sum"],
    },
    "Sliding Window Variant: At Most K": {
      easy: ["Max Consecutive Ones", "Max Consecutive Ones III"],
      medium: ["Longest Substring with At Most K Distinct Characters", "Fruit Into Baskets", "Longest Substring with At Most Two Distinct Characters"],
      hard: ["Subarrays with K Different Integers"],
    },
    "Sliding Window Variant: Exactly K": {
      easy: ["Binary Subarrays With Sum"],
      medium: ["Subarrays with K Different Integers", "Count Number of Nice Subarrays"],
      hard: ["Number of Substrings Containing All Three Characters", "Shortest Subarray with Sum at Least K"],
    },
    "Sliding Window Variant: Frequency Match": {
      easy: ["Find All Anagrams in a String"],
      medium: ["Permutation in String", "Minimum Window Substring"],
      hard: ["Substring with Concatenation of All Words", "Minimum Window Subsequence"],
    },
    "Sliding Window Variant: Monotonic Deque": {
      easy: ["Moving Average from Data Stream"],
      medium: ["Sliding Window Maximum", "Longest Continuous Subarray With Absolute Diff <= Limit"],
      hard: ["Shortest Subarray with Sum at Least K", "Constrained Subsequence Sum"],
    },
    "Two Pointers Pattern": {
      easy: ["Valid Palindrome", "Move Zeroes", "Merge Sorted Array"],
      medium: ["3Sum", "Container With Most Water", "Remove Duplicates from Sorted Array II"],
      hard: ["Trapping Rain Water", "4Sum", "Minimum Window Substring"],
    },
    "Two Pointers Variant: Opposite Ends": {
      easy: ["Two Sum II - Input Array Is Sorted", "Valid Palindrome"],
      medium: ["Container With Most Water", "3Sum", "3Sum Closest"],
      hard: ["Trapping Rain Water", "4Sum"],
    },
    "Two Pointers Variant: Fast/Slow": {
      easy: ["Middle of the Linked List", "Linked List Cycle"],
      medium: ["Linked List Cycle II", "Remove Nth Node From End of List", "Reorder List"],
      hard: ["Palindrome Linked List", "Sort List"],
    },
    "Two Pointers Variant: Partitioning": {
      easy: ["Sort Colors", "Move Zeroes"],
      medium: ["Partition Labels", "Wiggle Sort II", "Remove Duplicates from Sorted Array II"],
      hard: ["First Missing Positive", "Wiggle Sort II"],
    },
    "Two Pointers Variant: Merge / Intersection": {
      easy: ["Merge Sorted Array", "Intersection of Two Arrays"],
      medium: ["Interval List Intersections", "Merge Intervals"],
      hard: ["Median of Two Sorted Arrays", "Smallest Range Covering Elements from K Lists"],
    },
    "Two Pointers Variant: K-Sum Reduction": {
      easy: ["Two Sum II - Input Array Is Sorted"],
      medium: ["3Sum", "3Sum Closest", "4Sum"],
      hard: ["4Sum II", "K-th Smallest Pair Distance"],
    },
    "Fast and Slow Pointers": {
      easy: ["Linked List Cycle", "Middle of the Linked List"],
      medium: ["Linked List Cycle II", "Find the Duplicate Number", "Reorder List"],
      hard: ["Sort List", "Palindrome Linked List"],
    },
    "Prefix Sum + HashMap": {
      easy: ["Running Sum of 1d Array", "Find Pivot Index"],
      medium: ["Subarray Sum Equals K", "Contiguous Array", "Continuous Subarray Sum"],
      hard: ["Count of Range Sum", "Maximum Size Subarray Sum Equals k"],
    },
    "Monotonic Stack": {
      easy: ["Next Greater Element I"],
      medium: ["Daily Temperatures", "Next Greater Element II", "Online Stock Span"],
      hard: ["Largest Rectangle in Histogram", "Maximal Rectangle", "Trapping Rain Water"],
    },
    "Heap (Top-K Pattern)": {
      easy: ["Kth Largest Element in a Stream", "Last Stone Weight"],
      medium: ["Kth Largest Element in an Array", "Top K Frequent Elements", "K Closest Points to Origin"],
      hard: ["Find Median from Data Stream", "Minimum Cost to Hire K Workers", "IPO"],
    },
    "Backtracking (DFS with choices)": {
      easy: ["Letter Case Permutation", "Subsets"],
      medium: ["Subsets II", "Permutations", "Combination Sum", "Word Search"],
      hard: ["N-Queens", "Sudoku Solver", "Word Search II"],
    },
    "BFS Layer Traversal": {
      easy: ["Binary Tree Level Order Traversal", "Symmetric Tree"],
      medium: ["Binary Tree Zigzag Level Order Traversal", "Word Ladder", "Rotting Oranges"],
      hard: ["Word Ladder II", "Cut Off Trees for Golf Event", "Jump Game IV"],
    },
    "DP State Transition": {
      easy: ["Climbing Stairs", "Min Cost Climbing Stairs"],
      medium: ["Coin Change", "House Robber", "Unique Paths"],
      hard: ["Edit Distance", "Burst Balloons", "Regular Expression Matching"],
    },
    "Greedy Choice Pattern": {
      easy: ["Assign Cookies", "Lemonade Change"],
      medium: ["Jump Game", "Jump Game II", "Gas Station", "Partition Labels"],
      hard: ["Jump Game VI", "IPO", "Minimum Number of Arrows to Burst Balloons"],
    },
    "Graph Variant: DFS Components": {
      easy: ["Find if Path Exists in Graph", "Flood Fill"],
      medium: ["Number of Islands", "Max Area of Island", "Number of Connected Components in an Undirected Graph"],
      hard: ["Critical Connections in a Network", "Number of Good Paths"],
    },
    "Graph Variant: Multi-Source BFS": {
      easy: ["01 Matrix"],
      medium: ["Rotting Oranges", "Nearest Exit from Entrance in Maze"],
      hard: ["Shortest Path to Get All Keys", "Escape the Spreading Fire"],
    },
    "Graph Variant: Kahn Topological BFS": {
      easy: ["Find All Possible Recipes from Given Supplies"],
      medium: ["Course Schedule", "Course Schedule II", "Minimum Height Trees"],
      hard: ["Alien Dictionary", "Parallel Courses III"],
    },
    "Graph Variant: DFS Directed Cycle": {
      easy: ["Find if Path Exists in Graph"],
      medium: ["Course Schedule", "Find Eventual Safe States"],
      hard: ["Longest Cycle in a Graph", "Critical Connections in a Network"],
    },
    "Graph Variant: Bipartite BFS Coloring": {
      easy: ["Is Graph Bipartite?"],
      medium: ["Possible Bipartition", "Course Schedule IV"],
      hard: ["Divide Nodes Into the Maximum Number of Groups", "Shortest Path Visiting All Nodes"],
    },
    "Graph Variant: 0-1 BFS": {
      easy: ["Shortest Path in Binary Matrix"],
      medium: ["Minimum Cost to Make at Least One Valid Path in a Grid", "Network Delay Time"],
      hard: ["Minimum Obstacle Removal to Reach Corner", "Modify Graph Edge Weights"],
    },
    "Graph Variant: Grid Flood Fill": {
      easy: ["Flood Fill", "Number of Islands"],
      medium: ["Surrounded Regions", "Max Area of Island", "Pacific Atlantic Water Flow"],
      hard: ["Shortest Bridge", "Cut Off Trees for Golf Event"],
    },

    // ── Maths ────────────────────────────────────────────────
    "GCD and LCM": {
      easy: ["Find Greatest Common Divisor of Array", "Check if It Is a Good Array"],
      medium: ["Fraction Addition and Subtraction", "Nth Magical Number"],
      hard: ["Ugly Number III", "K-th Smallest Prime Fraction"],
    },
    "Extended Euclidean Algorithm": {
      easy: ["Find Greatest Common Divisor of Array"],
      medium: ["Fraction Addition and Subtraction", "Water and Jug Problem"],
      hard: ["Ugly Number III", "Count Primes in Range"],
    },
    "Binary Exponentiation + Fermat Inverse": {
      easy: ["Pow(x, n)"],
      medium: ["Super Pow", "Count Vowels Permutation"],
      hard: ["nCr mod prime (custom)", "Count of Integers (digit+fermat)"],
    },
    "Sieve of Eratosthenes": {
      easy: ["Count Primes"],
      medium: ["Four Divisors", "Almost Prime"],
      hard: ["K-th Smallest Prime Fraction", "Prime Palindrome"],
    },
    "Trial Division Factorization": {
      easy: ["Count Primes (intro)"],
      medium: ["Smallest Value After Replacing With Sum of Prime Factors", "2 Keys Keyboard"],
      hard: ["Largest Component Size by Common Factor", "K-th Smallest Prime Fraction"],
    },
    "nCr mod prime": {
      easy: ["Pascal's Triangle"],
      medium: ["Unique Paths", "Knight Dialer"],
      hard: ["Count Vowels Permutation", "Count of Range Sum"],
    },
    "Inclusion-Exclusion Principle": {
      easy: ["Count Integers With Even Digit Sum"],
      medium: ["Ugly Number II", "Nth Magical Number"],
      hard: ["Count Integers in Intervals", "K-th Smallest Prime Fraction"],
    },
    "Matrix Exponentiation": {
      easy: ["Fibonacci Number"],
      medium: ["N-th Tribonacci Number", "Count Ways to Build Good Strings"],
      hard: ["Count Vowels Permutation", "Solving Questions With Brainpower"],
    },
    "Orientation and Cross Product": {
      easy: ["Check if the Sentence Is Pangram"],
      medium: ["Erect the Fence", "Minimum Area Rectangle"],
      hard: ["Erect the Fence", "Maximum Area of a Piece of Cake After Horizontal and Vertical Cuts"],
    },
    "Bit Basics": {
      easy: ["Number of 1 Bits", "Reverse Bits", "Power of Two"],
      medium: ["Sum of Two Integers", "Counting Bits"],
      hard: ["Maximum XOR of Two Numbers in an Array"],
    },
    "XOR Cancellation Patterns": {
      easy: ["Single Number", "Missing Number"],
      medium: ["Single Number III", "Find the Duplicate Number"],
      hard: ["Maximum XOR of Two Numbers in an Array", "Find XOR Sum of All Pairs Bitwise AND"],
    },
    "Mask Enumeration Tricks": {
      easy: ["Subsets"],
      medium: ["Beautiful Arrangement", "Maximum Product of Word Lengths"],
      hard: ["Minimum Cost to Connect Two Groups of Points", "Parallel Courses II"],
    },
    "Count Bits / Prefix Bit Info": {
      easy: ["Number of 1 Bits", "Counting Bits"],
      medium: ["Bitwise AND of Numbers Range", "Decode XORed Array"],
      hard: ["Count Total Number of Colored Cells", "Maximum XOR of Two Numbers in an Array"],
    },
    "Bit Trie for XOR Optimization": {
      easy: ["Maximum XOR of Two Numbers in an Array (intro)"],
      medium: ["Maximum XOR of Two Numbers in an Array", "Find the Longest Substring Containing Vowels in Even Counts"],
      hard: ["Maximum XOR With an Element From Array", "Count Pairs With XOR in a Range"],
    },
    "Common Prefix Bit Trick": {
      easy: ["Number of 1 Bits"],
      medium: ["Bitwise AND of Numbers Range"],
      hard: ["Maximum XOR of Two Numbers in an Array", "Count Pairs With XOR in a Range"],
    },
    "Bit Manipulation Cheatsheet": {
      easy: ["Single Number", "Number of 1 Bits", "Power of Two"],
      medium: ["Counting Bits", "Bitwise AND of Numbers Range", "Sum of Two Integers"],
      hard: ["Maximum XOR of Two Numbers in an Array", "Minimum One Bit Operations to Make Integers Zero"],
    },
    "Prefix Sum Transform": {
      easy: ["Running Sum of 1d Array", "Find Pivot Index"],
      medium: ["Product of Array Except Self", "Subarray Sum Equals K", "Range Sum Query 2D - Immutable"],
      hard: ["Count of Range Sum", "Maximum Sum of 3 Non-Overlapping Subarrays"],
    },
    "Expected Value DP-style Setup": {
      easy: ["New 21 Game"],
      medium: ["Knight Probability in Chessboard", "Soup Servings"],
      hard: ["Airplane Seat Assignment Probability", "Cat and Mouse"],
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

export function ResultCard({ result, onReset, getCodeVariants, renderHighlightedCode, dpSteps }) {
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
      <div className="code-copy-bar">
        <button className="copy-btn" onClick={handleCopy}>
          {copyLabel}
        </button>
      </div>
      <pre className="java-block">{renderHighlightedCode(currentCode)}</pre>
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
      {(result.name === "ArrayList" || result.name === "Array (int[] / T[])") ? <ArrayVisualizer /> : null}
      {result.name === "Stack" ? <StackVisualizer /> : null}
      {result.name === "Queue" ? <QueueVisualizer /> : null}
      {result.name === "LinkedList (Deque API)" ? <LinkedListVisualizer /> : null}
      {(result.name === "TreeMap" || result.name === "TreeSet") ? <BSTVisualizer /> : null}
      {result.name === "Deque / Monotonic Queue" ? <DequeVisualizer /> : null}
      {result.name === "Trie" ? <TrieVisualizer /> : null}
      {result.name === "Union-Find (Disjoint Set Union)" ? <UnionFindVisualizer /> : null}
      {result.name === "Fenwick Tree (BIT)" ? <FenwickTreeVisualizer /> : null}
      {result.name === "Segment Tree" ? <SegmentTreeVisualizer /> : null}
      {result.name === "Sparse Table" ? <SparseTableVisualizer /> : null}
      {result.name === "Two Heaps (Median DS)" ? <TwoHeapsVisualizer /> : null}
      {result.name === "HashMap" ? <HashMapVisualizer /> : null}
      {result.name === "PriorityQueue" ? <PriorityQueueVisualizer /> : null}
      {result.name === "Red-Black Tree (via TreeMap/TreeSet)" ? <RedBlackTreeVisualizer /> : null}
      <button className="ghost-btn center-btn" onClick={onReset}>
        Start over
      </button>
    </div>
  );
}
