-- ─────────────────────────────────────────────
-- Seed: GATE CS Concept Tree
-- Weightage: Algorithms:9, OS:9, DBMS:7, CN:7, Maths:10, COA:6, TOC:6, DS:6
-- ─────────────────────────────────────────────

INSERT INTO concepts (subject, topic, subtopic, weightage_score, difficulty_base, description, exam_tips) VALUES

-- ═══════════════════════════ OPERATING SYSTEMS ═══════════════════════════
('OS', 'Process Management', 'CPU Scheduling', 9, 3,
 'Algorithms for deciding which process runs on the CPU and for how long.',
 'Know FCFS, SJF, SRTF, Round Robin, Priority scheduling — calculate avg waiting time.'),

('OS', 'Process Management', 'Process Synchronization', 9, 4,
 'Mechanisms to coordinate concurrent processes accessing shared resources.',
 'Understand Peterson's solution, semaphores (binary & counting), monitors.'),

('OS', 'Process Management', 'Deadlock', 9, 4,
 'Circular wait condition where processes block each other indefinitely.',
 'Banker's Algorithm questions are frequent — practice safe/unsafe state detection.'),

('OS', 'Process Management', 'Inter-process Communication', 9, 3,
 'Pipes, message queues, shared memory, and sockets for process communication.',
 'Know difference between shared memory and message passing models.'),

('OS', 'Memory Management', 'Paging', 9, 3,
 'Non-contiguous memory allocation dividing memory into fixed-size pages.',
 'Calculate page table size, internal fragmentation, and TLB miss penalty.'),

('OS', 'Memory Management', 'Segmentation', 9, 3,
 'Memory allocation dividing programs into logical segments of variable size.',
 'Know difference between segmentation and paging; external fragmentation.'),

('OS', 'Memory Management', 'Virtual Memory', 9, 4,
 'Technique allowing execution of processes not fully in main memory.',
 'Understand demand paging, page faults, and thrashing conditions.'),

('OS', 'Memory Management', 'Page Replacement Algorithms', 9, 4,
 'Policies for choosing which page to evict when physical memory is full.',
 'FIFO (Belady's anomaly), LRU, Optimal — know which has best performance.'),

('OS', 'Storage', 'File Systems', 9, 3,
 'Organization and management of files and directories on storage devices.',
 'Know inode structure, directory implementation, and file allocation methods.'),

('OS', 'Storage', 'Disk Scheduling', 9, 3,
 'Algorithms to order disk I/O requests minimizing seek time.',
 'Calculate seek distance for FCFS, SSTF, SCAN, C-SCAN, LOOK.'),

('OS', 'Storage', 'I/O Management', 9, 2,
 'OS management of I/O devices including buffering, caching, and spooling.',
 'Understand DMA, interrupt-driven I/O vs polling.'),

-- ═══════════════════════════ COMPUTER NETWORKS ═══════════════════════════
('CN', 'Network Layer', 'IPv4/IPv6', 7, 3,
 'Internet Protocol addressing and datagram format for network layer routing.',
 'Practice subnetting and CIDR notation — always asked in GATE.'),

('CN', 'Network Layer', 'Routing Algorithms', 7, 4,
 'Algorithms used by routers to determine optimal paths for packet delivery.',
 'Know Distance Vector (Bellman-Ford) vs Link State (Dijkstra); count-to-infinity problem.'),

('CN', 'Network Layer', 'Subnetting', 7, 3,
 'Dividing a network into smaller sub-networks for efficiency and security.',
 'Calculate subnet mask, network address, broadcast address, and host count.'),

('CN', 'Network Layer', 'NAT', 7, 2,
 'Network Address Translation maps private IPs to a public IP.',
 'Understand NAT types and port forwarding.'),

('CN', 'Transport Layer', 'TCP', 7, 4,
 'Reliable, connection-oriented transport protocol with flow and congestion control.',
 'Know 3-way handshake, sliding window, slow start, and congestion avoidance.'),

('CN', 'Transport Layer', 'UDP', 7, 2,
 'Connectionless transport protocol — fast but unreliable.',
 'UDP is stateless; used for DNS, DHCP, real-time apps.'),

('CN', 'Transport Layer', 'Congestion Control', 7, 4,
 'TCP mechanisms to prevent network congestion and packet loss.',
 'Slow start → congestion avoidance → fast retransmit → fast recovery.'),

('CN', 'Transport Layer', 'Flow Control', 7, 3,
 'TCP mechanism ensuring sender does not overwhelm receiver buffer.',
 'Sliding window: window size = min(cwnd, rwnd).'),

('CN', 'Application Layer', 'DNS', 7, 2,
 'Domain Name System resolves hostnames to IP addresses.',
 'Know iterative vs recursive resolution; A, MX, CNAME records.'),

('CN', 'Application Layer', 'HTTP', 7, 2,
 'HyperText Transfer Protocol — stateless application layer protocol.',
 'HTTP/1.1 vs HTTP/2; methods GET/POST/PUT/DELETE; status codes.'),

('CN', 'Application Layer', 'SMTP', 7, 2,
 'Simple Mail Transfer Protocol for email transmission.',
 'SMTP pushes mail; POP3/IMAP pull mail from server.'),

('CN', 'Application Layer', 'FTP', 7, 2,
 'File Transfer Protocol using two connections: control (21) and data (20).',
 'Active vs passive FTP mode is commonly asked.'),

('CN', 'Data Link Layer', 'MAC', 7, 3,
 'Media Access Control sublayer managing channel access in shared medium.',
 'Know CSMA/CD (wired) vs CSMA/CA (wireless) and their collision handling.'),

('CN', 'Data Link Layer', 'CSMA/CD', 7, 3,
 'Carrier Sense Multiple Access with Collision Detection — used in Ethernet.',
 'Minimum frame size = 2 × propagation delay × bandwidth.'),

('CN', 'Data Link Layer', 'CSMA/CA', 7, 3,
 'Carrier Sense Multiple Access with Collision Avoidance — used in WiFi.',
 'Uses RTS/CTS to avoid hidden terminal problem.'),

('CN', 'Data Link Layer', 'Error Detection', 7, 3,
 'Techniques like CRC, checksum, and parity to detect transmission errors.',
 'CRC division process is commonly asked — practice polynomial division.'),

-- ═══════════════════════════ DBMS ═══════════════════════════
('DBMS', 'Relational Model', 'ER Diagrams', 7, 3,
 'Entity-Relationship model for conceptual database design.',
 'Convert ER to relational schema; identify keys from cardinality.'),

('DBMS', 'Relational Model', 'Relational Algebra', 7, 4,
 'Formal query language with operations: select, project, join, union, difference.',
 'Practice converting SQL queries to relational algebra expressions.'),

('DBMS', 'Relational Model', 'SQL', 7, 3,
 'Structured Query Language for querying and manipulating relational databases.',
 'Know GROUP BY, HAVING, nested queries, joins (inner/outer/cross).'),

('DBMS', 'Normalization', '1NF-BCNF', 7, 4,
 'Database normalization forms ensuring data integrity and reducing redundancy.',
 'BCNF vs 3NF is frequently tested — know when decomposition is lossless.'),

('DBMS', 'Normalization', 'Functional Dependencies', 7, 4,
 'Constraints describing relationships between attributes in a relation.',
 'Compute closure of FDs; find minimal cover (canonical cover).'),

('DBMS', 'Normalization', 'Candidate Keys', 7, 3,
 'Minimal superkeys uniquely identifying tuples in a relation.',
 'Find all candidate keys from functional dependencies — frequently asked.'),

('DBMS', 'Transactions', 'ACID', 7, 2,
 'Atomicity, Consistency, Isolation, Durability — properties of DB transactions.',
 'Know which property each concurrency problem (dirty read, etc.) violates.'),

('DBMS', 'Transactions', 'Concurrency Control', 7, 4,
 'Techniques ensuring correctness when multiple transactions execute concurrently.',
 'Understand conflict serializability and precedence graphs.'),

('DBMS', 'Transactions', '2PL', 7, 4,
 'Two-Phase Locking protocol ensuring conflict-serializable schedules.',
 'Growing phase → shrinking phase; strict 2PL prevents cascading rollback.'),

('DBMS', 'Transactions', 'Serializability', 7, 4,
 'Property ensuring concurrent schedule equivalent to some serial schedule.',
 'Build conflict/view precedence graph; cycle = non-serializable.'),

('DBMS', 'Indexing', 'B-Trees', 7, 4,
 'Self-balancing tree structures for fast data retrieval in databases.',
 'Know order, min/max keys, and search/insert/delete operations.'),

('DBMS', 'Indexing', 'B+ Trees', 7, 4,
 'Variant of B-tree where all data is in leaves — used in most databases.',
 'All records at leaf level; internal nodes only store keys for routing.'),

('DBMS', 'Indexing', 'Hashing', 7, 3,
 'Direct address technique using hash functions for O(1) average access.',
 'Static vs dynamic hashing; linear probing vs chaining.'),

-- ═══════════════════════════ ALGORITHMS ═══════════════════════════
('Algorithms', 'Sorting', 'QuickSort', 9, 3,
 'Divide-and-conquer sorting algorithm with O(n log n) average case.',
 'Best/avg O(n log n), worst O(n²) — know pivot selection strategies.'),

('Algorithms', 'Sorting', 'MergeSort', 9, 3,
 'Stable divide-and-conquer sort with guaranteed O(n log n) performance.',
 'Always O(n log n); uses O(n) extra space; stable sort.'),

('Algorithms', 'Sorting', 'HeapSort', 9, 3,
 'In-place comparison sort using a binary heap data structure.',
 'O(n log n) always, O(1) space — not stable.'),

('Algorithms', 'Sorting', 'Counting Sort', 9, 2,
 'Non-comparison integer sorting algorithm with O(n+k) time.',
 'Linear time only when range k is small relative to n.'),

('Algorithms', 'Graph', 'BFS', 9, 3,
 'Breadth-First Search explores nodes level by level using a queue.',
 'BFS gives shortest path in unweighted graphs; O(V+E).'),

('Algorithms', 'Graph', 'DFS', 9, 3,
 'Depth-First Search explores as deep as possible using a stack/recursion.',
 'DFS for cycle detection, topological sort, SCC — know discovery/finish times.'),

('Algorithms', 'Graph', 'Dijkstra', 9, 4,
 'Greedy single-source shortest path for non-negative weighted graphs.',
 'O((V+E) log V) with priority queue; fails with negative edges.'),

('Algorithms', 'Graph', 'Bellman-Ford', 9, 4,
 'Dynamic programming shortest path that handles negative edge weights.',
 'O(VE); detects negative cycles; runs V-1 relaxation rounds.'),

('Algorithms', 'Graph', 'Floyd-Warshall', 9, 3,
 'All-pairs shortest path algorithm using dynamic programming.',
 'O(V³); works with negative edges; DP[i][j][k] formulation.'),

('Algorithms', 'Graph', 'Kruskal', 9, 3,
 'Greedy MST algorithm sorting edges and using union-find.',
 'Sort edges by weight; use disjoint set for cycle detection; O(E log E).'),

('Algorithms', 'Graph', 'Prim', 9, 3,
 'Greedy MST algorithm growing the tree one vertex at a time.',
 'O((V+E) log V) with min-heap; good for dense graphs.'),

('Algorithms', 'Dynamic Programming', 'LCS', 9, 4,
 'Longest Common Subsequence — classic DP problem.',
 'O(mn) time and space; reconstruct by backtracking the DP table.'),

('Algorithms', 'Dynamic Programming', 'LIS', 9, 4,
 'Longest Increasing Subsequence — O(n log n) with patience sorting.',
 'O(n²) DP or O(n log n) with binary search + patience sorting.'),

('Algorithms', 'Dynamic Programming', 'Knapsack', 9, 4,
 '0/1 Knapsack and unbounded knapsack optimization problems.',
 '0/1 Knapsack: O(nW) DP; unbounded: items can repeat.'),

('Algorithms', 'Dynamic Programming', 'Matrix Chain', 9, 4,
 'Optimal parenthesization of matrix multiplication to minimize operations.',
 'O(n³) DP; know how to fill the chain length table.'),

('Algorithms', 'Complexity', 'P vs NP', 9, 4,
 'Complexity class distinctions between efficiently solvable and verifiable problems.',
 'Know NP-complete problems: SAT, clique, vertex cover, TSP, Hamiltonian.'),

('Algorithms', 'Complexity', 'Time/Space Complexity', 9, 3,
 'Big-O analysis of algorithm efficiency in time and memory usage.',
 'Master recurrence relations: Master theorem T(n)=aT(n/b)+f(n).'),

('Algorithms', 'Complexity', 'Recurrences', 9, 4,
 'Solving recurrence relations using substitution, recursion tree, Master theorem.',
 'Master theorem cases: compare f(n) with n^(log_b a).'),

-- ═══════════════════════════ COA ═══════════════════════════
('COA', 'Processing', 'Pipelining', 6, 4,
 'Overlapping instruction execution stages to increase throughput.',
 'Speedup = k stages (ideal); hazards (structural, data, control) reduce it.'),

('COA', 'Processing', 'Hazards', 6, 4,
 'Pipeline hazards that prevent next instruction from executing on next cycle.',
 'Data hazard → forwarding; control hazard → branch prediction; structural → stall.'),

('COA', 'Processing', 'Instruction Set', 6, 3,
 'Set of instructions a processor can execute — RISC vs CISC.',
 'Know addressing modes: immediate, register, direct, indirect, indexed.'),

('COA', 'Memory', 'Cache Memory', 6, 4,
 'Small fast memory between CPU and main memory for performance.',
 'Hit time, miss penalty, AMAT = hit time + miss rate × miss penalty.'),

('COA', 'Memory', 'Cache Mapping', 6, 4,
 'Techniques for mapping main memory blocks to cache locations.',
 'Direct mapped, fully associative, set-associative — know tag/index/offset bits.'),

('COA', 'Memory', 'Memory Hierarchy', 6, 3,
 'Hierarchy of storage from registers to secondary storage by speed/cost.',
 'Locality of reference (temporal + spatial) drives cache effectiveness.'),

('COA', 'Number Systems', 'Fixed/Floating Point', 6, 3,
 'Binary representation of integers and real numbers in computer hardware.',
 'IEEE 754: 1 sign + 8 exponent + 23 mantissa for single precision.'),

('COA', 'Number Systems', 'Overflow', 6, 3,
 'Arithmetic result exceeds the representable range of the data type.',
 'Detect overflow in 2s complement: carry_in XOR carry_out of MSB.'),

('COA', 'Number Systems', 'Underflow', 6, 2,
 'Floating-point result is smaller than the minimum representable value.',
 'Occurs in floating point; result rounded to zero or denormalized.'),

-- ═══════════════════════════ TOC ═══════════════════════════
('TOC', 'Automata', 'DFA', 6, 3,
 'Deterministic Finite Automaton — accepts regular languages.',
 'Minimize DFA using table-filling algorithm; construct from NFA via subset construction.'),

('TOC', 'Automata', 'NFA', 6, 3,
 'Non-deterministic Finite Automaton — equivalent in power to DFA.',
 'Convert NFA→DFA using subset construction; ε-closure computation.'),

('TOC', 'Automata', 'ε-NFA', 6, 3,
 'NFA with ε-transitions (spontaneous state changes without input).',
 'Compute ε-closure; remove ε-transitions in equivalent NFA.'),

('TOC', 'Automata', 'Regular Expressions', 6, 3,
 'Compact notation for regular languages using union, concat, Kleene star.',
 'Convert regex to NFA (Thompson); DFA to regex (Arden's lemma).'),

('TOC', 'Grammars', 'CFG', 6, 4,
 'Context-Free Grammar generates context-free languages using production rules.',
 'Ambiguous grammar → multiple parse trees for same string.'),

('TOC', 'Grammars', 'CNF', 6, 3,
 'Chomsky Normal Form: all productions A→BC or A→a.',
 'Convert CFG to CNF for CYK parsing algorithm.'),

('TOC', 'Grammars', 'GNF', 6, 3,
 'Greibach Normal Form: all productions A→aα (terminal first).',
 'Used to eliminate left recursion; LL parsing.'),

('TOC', 'Grammars', 'Pushdown Automata', 6, 4,
 'Automaton with a stack — accepts context-free languages.',
 'PDA by final state vs empty stack are equivalent; DPDA is strictly weaker than NPDA.'),

('TOC', 'Computability', 'Turing Machines', 6, 4,
 'Theoretical model of computation recognizing recursively enumerable languages.',
 'Know decidable vs recognizable languages; multi-tape = single-tape in power.'),

('TOC', 'Computability', 'Decidability', 6, 4,
 'Property of problems that can be solved by an algorithm that always halts.',
 'Regular and CFL problems are decidable; halting problem is undecidable.'),

('TOC', 'Computability', 'Halting Problem', 6, 4,
 'Classic undecidable problem: cannot determine if a Turing Machine halts.',
 'Prove undecidability by reduction from halting problem.'),

-- ═══════════════════════════ DATA STRUCTURES ═══════════════════════════
('DS', 'Trees', 'Binary Trees', 6, 3,
 'Hierarchical data structure with at most two children per node.',
 'Height of complete binary tree with n nodes: ⌊log₂n⌋.'),

('DS', 'Trees', 'BST', 6, 3,
 'Binary Search Tree with ordered property for O(log n) search (avg case).',
 'Worst case O(n) for skewed BST; O(h) operations where h = height.'),

('DS', 'Trees', 'AVL', 6, 4,
 'Self-balancing BST with height difference ≤ 1 between subtrees.',
 'Rotations: LL, RR, LR, RL — know which rotation for each violation.'),

('DS', 'Trees', 'Red-Black', 6, 4,
 'Self-balancing BST using color property for O(log n) guaranteed operations.',
 'Black-height property; at most 2× height of corresponding AVL tree.'),

('DS', 'Trees', 'Heaps', 6, 3,
 'Complete binary tree satisfying heap property — used for priority queues.',
 'Build heap O(n); heapify O(log n); heap sort O(n log n).'),

('DS', 'Graphs', 'Representations', 6, 2,
 'Adjacency matrix O(V²) space vs adjacency list O(V+E) space.',
 'Use matrix for dense graphs, list for sparse — affects algorithm complexity.'),

('DS', 'Graphs', 'Topological Sort', 6, 3,
 'Linear ordering of DAG vertices such that all edges go forward.',
 'Use DFS (finish time reversal) or Kahn''s algorithm (BFS-based).'),

('DS', 'Graphs', 'SCC', 6, 4,
 'Strongly Connected Components — maximal subgraphs where every node reaches every other.',
 'Kosaraju''s (2 DFS) or Tarjan''s (1 DFS) algorithm.'),

('DS', 'Hashing', 'Hash Functions', 6, 3,
 'Functions mapping keys to hash table indices with low collision probability.',
 'Division method h(k) = k mod m; multiplication method.'),

('DS', 'Hashing', 'Collision Resolution', 6, 3,
 'Techniques for handling multiple keys mapping to the same hash slot.',
 'Chaining: O(1+α) expected; Open addressing: linear/quadratic probing, double hashing.'),

('DS', 'Advanced', 'Segment Trees', 6, 4,
 'Tree for range queries and updates in O(log n) time.',
 'Build O(n), query and update O(log n); lazy propagation for range updates.'),

('DS', 'Advanced', 'Tries', 6, 3,
 'Prefix tree for efficient string search and autocomplete.',
 'O(m) search where m = string length; used in IP routing.'),

('DS', 'Advanced', 'Disjoint Sets', 6, 3,
 'Union-Find data structure for disjoint set operations.',
 'Union by rank + path compression → nearly O(1) amortized.'),

-- ═══════════════════════════ ENGINEERING MATHS ═══════════════════════════
('Maths', 'Discrete', 'Propositional Logic', 10, 3,
 'Formal system for reasoning about truth values of propositions.',
 'Tautology, contradiction, equivalences — De Morgan''s law is frequently tested.'),

('Maths', 'Discrete', 'Set Theory', 10, 2,
 'Mathematical study of collections of objects — sets, relations, functions.',
 'Cardinality of power set = 2ⁿ; inclusion-exclusion principle.'),

('Maths', 'Discrete', 'Combinatorics', 10, 3,
 'Counting techniques: permutations, combinations, pigeonhole principle.',
 'Stars and bars, inclusion-exclusion, derangements — all appear in GATE.'),

('Maths', 'Discrete', 'Graph Theory', 10, 4,
 'Mathematical study of graphs — Euler paths, Hamiltonian cycles, coloring.',
 'Handshaking lemma: sum of degrees = 2|E|; planar graph: V−E+F=2.'),

('Maths', 'Linear Algebra', 'Matrix Operations', 10, 3,
 'Matrix addition, multiplication, transposition, and inversion.',
 'Know when matrix is invertible: det ≠ 0; rank = number of non-zero rows in REF.'),

('Maths', 'Linear Algebra', 'Eigenvalues', 10, 4,
 'Scalar values satisfying Av = λv for non-zero vector v.',
 'Characteristic polynomial det(A − λI) = 0; trace = sum of eigenvalues.'),

('Maths', 'Linear Algebra', 'Systems of Equations', 10, 3,
 'Solving Ax = b using Gaussian elimination and checking consistency.',
 'System consistent iff rank(A) = rank(A|b); unique solution iff rank = n.'),

('Maths', 'Probability', 'Conditional Probability', 10, 4,
 'P(A|B) = P(A∩B)/P(B) — probability of A given B has occurred.',
 'Bayes'' theorem: P(A|B) = P(B|A)P(A)/P(B).'),

('Maths', 'Probability', 'Bayes Theorem', 10, 4,
 'Relates prior and posterior probabilities using conditional probability.',
 'Used heavily in ML/AI context questions — practice with 2-3 event problems.'),

('Maths', 'Probability', 'Distributions', 10, 3,
 'Probability distributions: Binomial, Poisson, Normal, Geometric.',
 'Binomial B(n,p): mean=np, var=npq; Poisson: mean=var=λ.'),

('Maths', 'Calculus', 'Limits', 10, 2,
 'Fundamental concept of calculus describing function behavior near a point.',
 'L''Hôpital''s rule for 0/0 or ∞/∞ indeterminate forms.'),

('Maths', 'Calculus', 'Derivatives', 10, 2,
 'Rate of change of a function — chain rule, product rule, quotient rule.',
 'Know standard derivatives; maxima/minima using second derivative test.'),

('Maths', 'Calculus', 'Integration', 10, 2,
 'Reverse of differentiation — definite and indefinite integrals.',
 'Integration by parts: ∫u dv = uv − ∫v du; focus on definite integrals.');
