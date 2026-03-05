-- Interview Questions Expansion
-- Adding more questions for the interview preparation hub

-- Add more companies
INSERT INTO companies (name, slug, logo_url, description, focus_areas, difficulty_level) VALUES
    ('Twitter', 'twitter', 'https://logo.clearbit.com/twitter.com', 'Social media and real-time messaging platform', ARRAY['system_design', 'coding', 'real_time'], 'medium'),
    ('Uber', 'uber', 'https://logo.clearbit.com/uber.com', 'Ride-sharing and delivery platform', ARRAY['system_design', 'marketplace', 'real_time'], 'medium'),
    ('Spotify', 'spotify', 'https://logo.clearbit.com/spotify.com', 'Music streaming service', ARRAY['system_design', 'audio_processing', 'recommendations'], 'medium'),
    ('LinkedIn', 'linkedin', 'https://logo.clearbit.com/linkedin.com', 'Professional networking platform', ARRAY['system_design', 'networking', 'search'], 'medium'),
    ('Dropbox', 'dropbox', 'https://logo.clearbit.com/dropbox.com', 'Cloud storage and file sync', ARRAY['system_design', 'storage', 'file_sync'], 'medium'),
    ('Slack', 'slack', 'https://logo.clearbit.com/slack.com', 'Business communication platform', ARRAY['system_design', 'real_time', 'messaging'], 'medium'),
    ('Zoom', 'zoom', 'https://logo.clearbit.com/zoom.us', 'Video conferencing platform', ARRAY['system_design', 'video', 'real_time'], 'medium'),
    ('Snap', 'snap', 'https://logo.clearbit.com/snapchat.com', 'Social media and AR platform', ARRAY['system_design', 'media', 'ar'], 'medium'),
    ('Pinterest', 'pinterest', 'https://logo.clearbit.com/pinterest.com', 'Image sharing and discovery', ARRAY['system_design', 'search', 'recommendations'], 'medium'),
    ('DoorDash', 'doordash', 'https://logo.clearbit.com/doordash.com', 'Food delivery platform', ARRAY['system_design', 'marketplace', 'logistics'], 'medium'),
    ('Coinbase', 'coinbase', 'https://logo.clearbit.com/coinbase.com', 'Cryptocurrency exchange', ARRAY['system_design', 'fintech', 'security'], 'hard'),
    ('Bloomberg', 'bloomberg', 'https://logo.clearbit.com/bloomberg.com', 'Financial data and news', ARRAY['system_design', 'real_time', 'data'], 'hard')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- META (FACEBOOK) QUESTIONS
-- =====================================================

-- System Design - Meta
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'system_design', 'medium', 'Design a Search Autocomplete System',
    'Design a search autocomplete system like the one used in Facebook search. Users should get relevant suggestions as they type.',
    ARRAY['Consider trie data structure', 'Think about ranking suggestions', 'Handle real-time updates'],
    ARRAY['trie', 'caching', 'ranking', 'api_design']
FROM companies c WHERE c.slug = 'meta'

UNION ALL

SELECT c.id, 'system_design', 'hard', 'Design Instagram',
    'Design a photo sharing platform like Instagram. Users can upload photos, follow others, like, and comment.',
    ARRAY['Photo storage and CDN', 'Feed generation', 'Database sharding'],
    ARRAY['storage', 'cdn', 'social', 'database']
FROM companies c WHERE c.slug = 'meta'

UNION ALL

SELECT c.id, 'system_design', 'hard', 'Design WhatsApp',
    'Design a messaging app like WhatsApp. Support one-on-one messaging, group chats, and read receipts.',
    ARRAY['Message ordering', 'Encryption considerations', 'Offline message delivery'],
    ARRAY['messaging', 'real_time', 'database', 'concurrency']
FROM companies c WHERE c.slug = 'meta'

UNION ALL

SELECT c.id, 'system_design', 'medium', 'Design a Trending Topics System',
    'Design a system to identify and display trending topics in real-time, like Facebook''s trending section.',
    ARRAY['Time-windowed aggregation', 'Popularity scoring', 'Handle spam'],
    ARRAY['analytics', 'real_time', 'ranking']
FROM companies c WHERE c.slug = 'meta';

-- Coding - Meta
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'coding', 'easy', 'Reverse a Linked List',
    'Given the head of a singly linked list, reverse the list and return the reversed list.',
    ARRAY['Use three pointers', 'Consider iterative vs recursive approaches'],
    ARRAY['linked_lists', 'pointers', 'iteration']
FROM companies c WHERE c.slug = 'meta'

UNION ALL

SELECT c.id, 'coding', 'medium', 'Longest Substring Without Repeating Characters',
    'Given a string s, find the length of the longest substring without repeating characters.',
    ARRAY['Use sliding window', 'Hash map for character positions'],
    ARRAY['strings', 'sliding_window', 'hash_tables']
FROM companies c WHERE c.slug = 'meta'

UNION ALL

SELECT c.id, 'coding', 'medium', 'Merge Intervals',
    'Given an array of intervals, merge all overlapping intervals and return the sorted result.',
    ARRAY['Sort intervals first', 'Think about edge cases'],
    ARRAY['arrays', 'sorting', 'interval_problems']
FROM companies c WHERE c.slug = 'meta'

UNION ALL

SELECT c.id, 'coding', 'hard', 'Word Search II',
    'Given a 2D board and a list of words, find all words in the board that can be formed by adjacent letters.',
    ARRAY['Use Trie for prefix matching', 'Consider backtracking', 'Optimize with pruning'],
    ARRAY['trie', 'backtracking', 'dfs', 'matrix']
FROM companies c WHERE c.slug = 'meta'

UNION ALL

SELECT c.id, 'coding', 'hard', 'Serialize and Deserialize Binary Tree',
    'Design an algorithm to serialize and deserialize a binary tree into a string and back.',
    ARRAY['Consider preorder traversal', 'Handle null nodes', 'Think about space efficiency'],
    ARRAY['trees', 'serialization', 'bfs', 'dfs']
FROM companies c WHERE c.slug = 'meta';

-- Behavioral - Meta
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'behavioral', 'medium', 'Tell Me About a Technical Challenge',
    'Describe a time when you faced a significant technical challenge. How did you overcome it?',
    ARRAY['Use STAR method', 'Focus on problem-solving process', 'Show collaboration'],
    ARRAY['problem_solving', 'technical', 'communication']
FROM companies c WHERE c.slug = 'meta'

UNION ALL

SELECT c.id, 'behavioral', 'medium', 'Why Meta?',
    'Why do you want to work at Meta? What excites you about our mission?',
    ARRAY['Research Meta''s products', 'Align your values with company mission', 'Show passion for impact'],
    ARRAY['motivation', 'company_culture', 'research']
FROM companies c WHERE c.slug = 'meta';

-- =====================================================
-- GOOGLE QUESTIONS
-- =====================================================

-- System Design - Google
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'system_design', 'hard', 'Design Google Search',
    'Design a search engine like Google. Handle billions of queries, ranking, and provide relevant results.',
    ARRAY['Web indexing', 'PageRank algorithm', 'Query processing pipeline'],
    ARRAY['search', 'ranking', 'indexing', 'distributed']
FROM companies c WHERE c.slug = 'google'

UNION ALL

SELECT c.id, 'system_design', 'hard', 'Design Google Maps',
    'Design a mapping service like Google Maps. Include routing, traffic estimation, and place search.',
    ARRAY['Graph algorithms for routing', 'Real-time traffic data', 'Point of interest search'],
    ARRAY['graphs', 'routing', 'algorithms', 'real_time']
FROM companies c WHERE c.slug = 'google'

UNION ALL

SELECT c.id, 'system_design', 'medium', 'Design a Distributed Cache',
    'Design a distributed caching system like Memcached. Handle cache misses, evictions, and consistency.',
    ARRAY['Consistent hashing', 'Cache invalidation', 'Replication strategies'],
    ARRAY['caching', 'distributed_systems', 'consistency']
FROM companies c WHERE c.slug = 'google'

UNION ALL

SELECT c.id, 'system_design', 'hard', 'Design Gmail',
    'Design an email service like Gmail. Handle sending, receiving, searching, and spam filtering.',
    ARRAY['Email storage and indexing', 'Search functionality', 'Spam detection'],
    ARRAY['storage', 'search', 'messaging', 'ml']
FROM companies c WHERE c.slug = 'google';

-- Coding - Google
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'coding', 'medium', 'Validate Binary Search Tree',
    'Given the root of a binary tree, determine if it is a valid binary search tree.',
    ARRAY['Think about valid range for each node', 'Consider recursive approach'],
    ARRAY['trees', 'bst', 'recursion', 'validation']
FROM companies c WHERE c.slug = 'google'

UNION ALL

SELECT c.id, 'coding', 'medium', 'Word Break',
    'Given a string s and a dictionary of words, determine if s can be segmented into a space-separated sequence of dictionary words.',
    ARRAY['Use dynamic programming', 'Think about substrings'],
    ARRAY['strings', 'dynamic_programming', 'trie']
FROM companies c WHERE c.slug = 'google'

UNION ALL

SELECT c.id, 'coding', 'hard', 'Trapping Rain Water',
    'Given n non-negative integers representing an elevation map, compute how much water it can trap after raining.',
    ARRAY['Use two-pointer approach', 'Think about maximum heights on each side'],
    ARRAY['arrays', 'two_pointers', 'dynamic_programming']
FROM companies c WHERE c.slug = 'google'

UNION ALL

SELECT c.id, 'coding', 'hard', 'Merge Intervals',
    'Given a collection of intervals, merge all overlapping intervals.',
    ARRAY['Sort by start time', 'Think about edge cases with single intervals'],
    ARRAY['arrays', 'sorting', 'interval_problems']
FROM companies c WHERE c.slug = 'google'

UNION ALL

SELECT c.id, 'coding', 'medium', 'Binary Tree Level Order Traversal',
    'Given the root of a binary tree, return the level order traversal of its nodes values.',
    ARRAY['Use BFS with queue', 'Track level information'],
    ARRAY['trees', 'bfs', 'traversal']
FROM companies c WHERE c.slug = 'google';

-- Behavioral - Google
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'behavioral', 'medium', 'Tell Me About a Time You Disagreed with Your Manager',
    'Describe a situation where you disagreed with your manager. How did you handle it?',
    ARRAY['Show respect for hierarchy', 'Focus on constructive resolution', 'Demonstrate communication skills'],
    ARRAY['conflict_resolution', 'communication', 'leadership']
FROM companies c WHERE c.slug = 'google'

UNION ALL

SELECT c.id, 'behavioral', 'medium', 'Googleyness - Tell Me About a Time You Failed',
    'Tell me about a time you failed. What did you learn from this experience?',
    ARRAY['Be honest and authentic', 'Show self-awareness', 'Demonstrate growth mindset'],
    ARRAY['self_awareness', 'learning', 'growth_mindset']
FROM companies c WHERE c.slug = 'google';

-- =====================================================
-- AMAZON QUESTIONS
-- =====================================================

-- System Design - Amazon
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'system_design', 'medium', 'Design Amazon Prime Video',
    'Design a video streaming service like Amazon Prime Video. Handle video encoding, streaming, and recommendations.',
    ARRAY['CDN strategy', 'Video transcoding pipeline', 'Recommendation system'],
    ARRAY['video_processing', 'cdn', 'streaming', 'recommendations']
FROM companies c WHERE c.slug = 'amazon'

UNION ALL

SELECT c.id, 'system_design', 'medium', 'Design Amazon Marketplace',
    'Design a marketplace like Amazon. Handle product listings, search, cart, and order management.',
    ARRAY['Inventory management', 'Search and filtering', 'Payment processing'],
    ARRAY['marketplace', 'database', 'search', 'transactions']
FROM companies c WHERE c.slug = 'amazon'

UNION ALL

SELECT c.id, 'system_design', 'medium', 'Design a Notification System',
    'Design a notification system that can send push, SMS, and email notifications to millions of users.',
    ARRAY['Queue-based architecture', 'Rate limiting', 'Template system'],
    ARRAY['messaging', 'queues', 'scalability']
FROM companies c WHERE c.slug = 'amazon'

UNION ALL

SELECT c.id, 'system_design', 'hard', 'Design Amazon DynamoDB',
    'Design a NoSQL database like DynamoDB. Handle partitioning, replication, and consistency.',
    ARRAY['Consistent hashing', 'Vector clocks', 'Quorum reads/writes'],
    ARRAY['nosql', 'distributed_systems', 'consistency', 'storage']
FROM companies c WHERE c.slug = 'amazon';

-- Coding - Amazon
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'coding', 'easy', 'Valid Parentheses',
    'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.',
    ARRAY['Use a stack', 'Match opening with closing brackets'],
    ARRAY['strings', 'stack', 'validation']
FROM companies c WHERE c.slug = 'amazon'

UNION ALL

SELECT c.id, 'coding', 'medium', 'Number of Islands',
    'Given a 2D grid of "1"s (land) and "0"s (water), count the number of islands.',
    ARRAY['Use DFS or BFS', 'Mark visited cells', 'Think about connected components'],
    ARRAY['graphs', 'dfs', 'bfs', 'matrix']
FROM companies c WHERE c.slug = 'amazon'

UNION ALL

SELECT c.id, 'coding', 'medium', 'LRU Cache',
    'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.',
    ARRAY['Use hash map and doubly linked list', 'O(1) operations required'],
    ARRAY['data_structures', 'design', 'hash_tables', 'linked_lists']
FROM companies c WHERE c.slug = 'amazon'

UNION ALL

SELECT c.id, 'coding', 'medium', 'Product of Array Except Self',
    'Given an array nums, return an array answer such that answer[i] is equal to the product of all elements of nums except nums[i].',
    ARRAY['Use prefix and suffix products', 'O(1) space solution possible'],
    ARRAY['arrays', 'dynamic_programming', 'math']
FROM companies c WHERE c.slug = 'amazon'

UNION ALL

SELECT c.id, 'coding', 'hard', 'Word Search',
    'Given a 2D board and a word, determine if the word exists in the grid by adjacent letters.',
    ARRAY['Use backtracking', 'Mark visited cells', 'DFS from each starting point'],
    ARRAY['matrix', 'backtracking', 'dfs', 'strings']
FROM companies c WHERE c.slug = 'amazon';

-- Behavioral - Amazon (Leadership Principles focus)
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'behavioral', 'medium', 'Customer Obsession - Tell Me About a Time',
    'Tell me about a time when you went above and beyond for a customer.',
    ARRAY['Use STAR method', 'Focus on customer outcome', 'Show initiative'],
    ARRAY['customer_service', 'leadership', 'customer_obsession']
FROM companies c WHERE c.slug = 'amazon'

UNION ALL

SELECT c.id, 'behavioral', 'medium', 'Dive Deep - Tell Me About a Time',
    'Tell me about a time when you dove deep into a technical problem.',
    ARRAY['Show technical depth', 'Demonstrate persistence', 'Show analytical skills'],
    ARRAY['technical', 'problem_solving', 'dive_deep']
FROM companies c WHERE c.slug = 'amazon'

UNION ALL

SELECT c.id, 'behavioral', 'medium', 'Have Backbone - Tell Me About a Time',
    'Tell me about a time when you had to disagree with your team or leadership.',
    ARRAY['Show courage', 'Demonstrate respect', 'Focus on data/facts'],
    ARRAY['conflict_resolution', 'leadership', 'communication']
FROM companies c WHERE c.slug = 'amazon'

UNION ALL

SELECT c.id, 'behavioral', 'medium', 'Why Amazon?',
    'Why do you want to work at Amazon?',
    ARRAY['Know Amazon''s leadership principles', 'Align with customer obsession', 'Show specific interest'],
    ARRAY['motivation', 'company_culture', 'research']
FROM companies c WHERE c.slug = 'amazon';

-- =====================================================
-- APPLE QUESTIONS
-- =====================================================

-- System Design - Apple
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'system_design', 'hard', 'Design iCloud',
    'Design a cloud storage service like iCloud. Handle file sync, backup, and privacy.',
    ARRAY['End-to-end encryption', 'Conflict resolution', 'Delta sync'],
    ARRAY['storage', 'encryption', 'sync', 'privacy']
FROM companies c WHERE c.slug = 'apple'

UNION ALL

SELECT c.id, 'system_design', 'hard', 'Design Apple Maps',
    'Design a navigation service like Apple Maps. Include routing, real-time traffic, and indoor maps.',
    ARRAY['Map data sources', 'Routing algorithms', 'Privacy considerations'],
    ARRAY['routing', 'maps', 'privacy', 'real_time']
FROM companies c WHERE c.slug = 'apple'

UNION ALL

SELECT c.id, 'system_design', 'medium', 'Design FaceTime',
    'Design a video calling service like FaceTime. Handle real-time video, audio, and group calls.',
    ARRAY['WebRTC considerations', 'Quality adaptation', 'End-to-end encryption'],
    ARRAY['video', 'real_time', 'webrtc', 'encryption']
FROM companies c WHERE c.slug = 'apple';

-- Coding - Apple
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'coding', 'medium', 'Rotate Array',
    'Given an array, rotate the array to the right by k steps.',
    ARRAY['Consider reversing approach', 'Handle k larger than array length'],
    ARRAY['arrays', 'in_place', 'math']
FROM companies c WHERE c.slug = 'apple'

UNION ALL

SELECT c.id, 'coding', 'medium', 'Search in Rotated Sorted Array',
    'Search for a target value in a rotated sorted array with no duplicates.',
    ARRAY['Use modified binary search', 'Identify sorted half'],
    ARRAY['arrays', 'binary_search', 'search']
FROM companies c WHERE c.slug = 'apple'

UNION ALL

SELECT c.id, 'coding', 'hard', 'Median of Two Sorted Arrays',
    'Given two sorted arrays nums1 and nums2 of size m and n, return the median of the two sorted arrays.',
    ARRAY['Use binary search', 'Think about partition points', 'O(log(m+n)) solution required'],
    ARRAY['arrays', 'binary_search', 'divide_conquer']
FROM companies c WHERE c.slug = 'apple'

UNION ALL

SELECT c.id, 'coding', 'medium', 'Validate BST',
    'Given the root of a binary tree, determine if it is a valid binary search tree.',
    ARRAY['Pass valid range to children', 'Consider integer overflow'],
    ARRAY['trees', 'bst', 'validation', 'recursion']
FROM companies c WHERE c.slug = 'apple';

-- Behavioral - Apple
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'behavioral', 'medium', 'Tell Me About a Time You Simplified Something',
    'Describe a time when you took a complex problem and simplified it for users or stakeholders.',
    ARRAY['Show user empathy', 'Demonstrate simplicity in thinking', 'Show impact'],
    ARRAY['simplicity', 'user_experience', 'communication']
FROM companies c WHERE c.slug = 'apple'

UNION ALL

SELECT c.id, 'behavioral', 'medium', 'Why Apple?',
    'Why do you want to work at Apple?',
    ARRAY['Show passion for Apple products', 'Align with privacy focus', 'Show craftsmanship interest'],
    ARRAY['motivation', 'company_culture', 'products']
FROM companies c WHERE c.slug = 'apple';

-- =====================================================
-- MICROSOFT QUESTIONS
-- =====================================================

-- System Design - Microsoft
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'system_design', 'medium', 'Design Azure Blob Storage',
    'Design a cloud storage service like Azure Blob Storage. Handle large files, tiered storage, and access control.',
    ARRAY['Data partitioning', 'Redundancy strategies', 'Access patterns'],
    ARRAY['storage', 'cloud', 'scalability']
FROM companies c WHERE c.slug = 'microsoft'

UNION ALL

SELECT c.id, 'system_design', 'medium', 'Design Teams',
    'Design a video conferencing platform like Microsoft Teams. Handle messaging, calls, and screen sharing.',
    ARRAY['Real-time communication', 'State management', 'Meeting scaling'],
    ARRAY['real_time', 'messaging', 'video', 'conferencing']
FROM companies c WHERE c.slug = 'microsoft'

UNION ALL

SELECT c.id, 'system_design', 'medium', 'Design Outlook Calendar',
    'Design a calendar system like Outlook. Handle scheduling, conflicts, and notifications.',
    ARRAY['Availability calculation', 'Time zone handling', 'Recurring events'],
    ARRAY['scheduling', 'time_zones', 'database']
FROM companies c WHERE c.slug = 'microsoft'

UNION ALL

SELECT c.id, 'system_design', 'hard', 'Design Bing Search',
    'Design a search engine like Bing. Handle web crawling, indexing, and ranking.',
    ARRAY['Crawler architecture', 'Index design', 'Ranking algorithms'],
    ARRAY['search', 'indexing', 'ranking', 'crawling']
FROM companies c WHERE c.slug = 'microsoft';

-- Coding - Microsoft
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'coding', 'easy', 'Invert Binary Tree',
    'Given the root of a binary tree, invert the tree (mirror it).',
    ARRAY['Use recursion', 'Swap left and right children'],
    ARRAY['trees', 'recursion', 'traversal']
FROM companies c WHERE c.slug = 'microsoft'

UNION ALL

SELECT c.id, 'coding', 'medium', 'Longest Palindromic Substring',
    'Given a string s, return the longest palindromic substring in s.',
    ARRAY['Expand around center approach', 'Dynamic programming possible'],
    ARRAY['strings', 'palindromes', 'dynamic_programming']
FROM companies c WHERE c.slug = 'microsoft'

UNION ALL

SELECT c.id, 'coding', 'medium', 'Container With Most Water',
    'Given an array of integers height, find the container that holds the most water.',
    ARRAY['Use two pointers', 'Move the smaller height pointer'],
    ARRAY['arrays', 'two_pointers', 'greedy']
FROM companies c WHERE c.slug = 'microsoft'

UNION ALL

SELECT c.id, 'coding', 'hard', 'Minimum Window Substring',
    'Given two strings s and t, return the minimum window substring of s that contains all characters of t.',
    ARRAY['Use sliding window', 'Track character counts', 'Expand and contract'],
    ARRAY['strings', 'sliding_window', 'hash_tables']
FROM companies c WHERE c.slug = 'microsoft'

UNION ALL

SELECT c.id, 'coding', 'medium', 'Clone Graph',
    'Given a reference of a node in a connected undirected graph, return a deep copy of the graph.',
    ARRAY['Use hash map for mapping', 'Handle visited nodes', 'BFS or DFS'],
    ARRAY['graphs', 'bfs', 'dfs', 'recursion']
FROM companies c WHERE c.slug = 'microsoft';

-- Behavioral - Microsoft
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'behavioral', 'medium', 'Tell Me About a Time You Had a Conflict with a Coworker',
    'Describe a time when you had a conflict with a coworker. How did you resolve it?',
    ARRAY['Show empathy', 'Focus on resolution', 'Demonstrate communication'],
    ARRAY['conflict_resolution', 'teamwork', 'communication']
FROM companies c WHERE c.slug = 'microsoft'

UNION ALL

SELECT c.id, 'behavioral', 'medium', 'Growth Mindset - Tell Me About Learning',
    'Tell me about a time when you had to learn something new quickly.',
    ARRAY['Show enthusiasm for learning', 'Demonstrate self-motivation', 'Show concrete results'],
    ARRAY['learning', 'growth_mindset', 'adaptability']
FROM companies c WHERE c.slug = 'microsoft'

UNION ALL

SELECT c.id, 'behavioral', 'medium', 'Why Microsoft?',
    'Why do you want to work at Microsoft?',
    ARRAY['Know Microsoft products', 'Show impact interest', 'Align with mission'],
    ARRAY['motivation', 'company_culture', 'growth']
FROM companies c WHERE c.slug = 'microsoft';

-- =====================================================
-- NETFLIX QUESTIONS
-- =====================================================

-- System Design - Netflix
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'system_design', 'hard', 'Design Netflix Recommendation System',
    'Design a movie recommendation system like Netflix. Handle personalization at scale.',
    ARRAY['Collaborative filtering', 'Content-based filtering', 'A/B testing'],
    ARRAY['recommendations', 'ml', 'personalization', 'analytics']
FROM companies c WHERE c.slug = 'netflix'

UNION ALL

SELECT c.id, 'system_design', 'hard', 'Design Netflix Content Delivery',
    'Design how Netflix delivers content to millions of users globally. Include CDN and streaming.',
    ARRAY['Open Connect', 'Adaptive bitrate', 'Cache hierarchy'],
    ARRAY['cdn', 'streaming', 'video_processing', 'global_distribution']
FROM companies c WHERE c.slug = 'netflix'

UNION ALL

SELECT c.id, 'system_design', 'medium', 'Design Netflix Viewing History',
    'Design a system to track and display user viewing history and continue watching.',
    ARRAY['Time-series data', 'Efficient storage', 'Real-time updates'],
    ARRAY['database', 'time_series', 'user_data']
FROM companies c WHERE c.slug = 'netflix';

-- Coding - Netflix
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'coding', 'medium', 'Decode Ways',
    'A message containing letters from A-Z is encoded to numbers. Given the encoded message, return the number of ways to decode it.',
    ARRAY['Dynamic programming', 'Handle invalid encodings', 'Consider 0 cases'],
    ARRAY['strings', 'dynamic_programming', 'decoding']
FROM companies c WHERE c.slug = 'netflix'

UNION ALL

SELECT c.id, 'coding', 'medium', 'House Robber',
    'Given an array of non-negative integers representing the amount of money at each house, determine the maximum amount of money you can rob without robbing adjacent houses.',
    ARRAY['Dynamic programming', 'Consider rob or skip each house'],
    ARRAY['dynamic_programming', 'arrays', 'optimization']
FROM companies c WHERE c.slug = 'netflix'

UNION ALL

SELECT c.id, 'coding', 'hard', 'Maximum Sum Subarray',
    'Find the contiguous subarray with the largest sum in an array of integers.',
    ARRAY['Kadane''s algorithm', 'Dynamic programming approach'],
    ARRAY['arrays', 'dynamic_programming', 'kadane']
FROM companies c WHERE c.slug = 'netflix';

-- Behavioral - Netflix
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'behavioral', 'medium', 'Tell Me About a Time You Had to Innovate',
    'Describe a time when you had to come up with an innovative solution to a problem.',
    ARRAY['Show creativity', 'Demonstrate impact', 'Show iteration process'],
    ARRAY['innovation', 'problem_solving', 'creativity']
FROM companies c WHERE c.slug = 'netflix'

UNION ALL

SELECT c.id, 'behavioral', 'medium', 'Netflix Culture - Freedom and Responsibility',
    'How do you demonstrate freedom and responsibility in your work?',
    ARRAY['Know Netflix culture', 'Show ownership mentality', 'Demonstrate accountability'],
    ARRAY['culture', 'ownership', 'accountability']
FROM companies c WHERE c.slug = 'netflix';

-- =====================================================
-- STRIPE QUESTIONS
-- =====================================================

-- System Design - Stripe
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'system_design', 'hard', 'Design a Payment Processing System',
    'Design a payment processing system like Stripe. Handle transactions, refunds, and fraud detection.',
    ARRAY['Idempotency', 'Transaction states', 'ACID compliance'],
    ARRAY['payments', 'transactions', 'security', 'fintech']
FROM companies c WHERE c.slug = 'stripe'

UNION ALL

SELECT c.id, 'system_design', 'hard', 'Design a Ledger System',
    'Design a financial ledger system to track all transactions accurately.',
    ARRAY['Double-entry bookkeeping', 'Audit trails', 'Event sourcing'],
    ARRAY['fintech', 'accounting', 'database', 'consistency']
FROM companies c WHERE c.slug = 'stripe'

UNION ALL

SELECT c.id, 'system_design', 'medium', 'Design a Subscription Billing System',
    'Design a subscription billing system. Handle recurring payments, trials, and upgrades.',
    ARRAY['Billing cycles', 'Proration', 'Failed payment handling'],
    ARRAY['billing', 'subscriptions', 'payments']
FROM companies c WHERE c.slug = 'stripe';

-- Coding - Stripe
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'coding', 'medium', 'Implement Rate Limiter',
    'Design and implement a rate limiter that limits requests per user.',
    ARRAY['Token bucket or sliding window', 'Consider distributed systems'],
    ARRAY['system_design', 'rate_limiting', 'algorithms']
FROM companies c WHERE c.slug = 'stripe'

UNION ALL

SELECT c.id, 'coding', 'medium', 'LRU Cache Implementation',
    'Implement an LRU cache with O(1) get and put operations.',
    ARRAY['Hash map + doubly linked list', 'Consider thread safety'],
    ARRAY['data_structures', 'cache', 'design']
FROM companies c WHERE c.slug = 'stripe'

UNION ALL

SELECT c.id, 'coding', 'hard', 'Design a URL Shortener',
    'Design and implement a URL shortener like bit.ly.',
    ARRAY['Hash function for encoding', 'Database design', 'Redirect handling'],
    ARRAY['system_design', 'database', 'api_design']
FROM companies c WHERE c.slug = 'stripe';

-- Behavioral - Stripe
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'behavioral', 'medium', 'Tell Me About a Complex Technical Problem',
    'Describe the most complex technical problem you have solved.',
    ARRAY['Show technical depth', 'Demonstrate problem-solving', 'Show collaboration'],
    ARRAY['technical', 'problem_solving', 'depth']
FROM companies c WHERE c.slug = 'stripe'

UNION ALL

SELECT c.id, 'behavioral', 'medium', 'Why Stripe?',
    'Why do you want to work at Stripe?',
    ARRAY['Show fintech interest', 'Know Stripe''s mission', 'Show developer empathy'],
    ARRAY['motivation', 'fintech', 'developer_experience']
FROM companies c WHERE c.slug = 'stripe';

-- =====================================================
-- AIRBNB QUESTIONS
-- =====================================================

-- System Design - Airbnb
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'system_design', 'hard', 'Design Airbnb Search',
    'Design the search functionality for Airbnb. Handle filters, ranking, and availability.',
    ARRAY['Search ranking', 'Filter system', 'Price optimization'],
    ARRAY['search', 'ranking', 'marketplace', 'recommendations']
FROM companies c WHERE c.slug = 'airbnb'

UNION ALL

SELECT c.id, 'system_design', 'medium', 'Design Booking System',
    'Design a hotel booking system like Airbnb. Handle reservations, availability, and payments.',
    ARRAY['Date range queries', 'Concurrent booking', 'Calendar sync'],
    ARRAY['bookings', 'database', 'concurrency', 'transactions']
FROM companies c WHERE c.slug = 'airbnb'

UNION ALL

SELECT c.id, 'system_design', 'medium', 'Design Review System',
    'Design a review system for hosts and guests. Handle ratings and reviews.',
    ARRAY['Trust and safety', 'Review timing', 'Anomaly detection'],
    ARRAY['reviews', 'ratings', 'trust']
FROM companies c WHERE c.slug = 'airbnb';

-- Coding - Airbnb
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'coding', 'medium', 'Meeting Rooms II',
    'Given an array of meeting time intervals, find the minimum number of conference rooms required.',
    ARRAY['Use min-heap', 'Sort by start time'],
    ARRAY['intervals', 'greedy', 'heap', 'sorting']
FROM companies c WHERE c.slug = 'airbnb'

UNION ALL

SELECT c.id, 'coding', 'medium', 'Merge Intervals',
    'Given a collection of intervals, merge all overlapping intervals.',
    ARRAY['Sort by start time', 'Handle edge cases'],
    ARRAY['intervals', 'sorting', 'arrays']
FROM companies c WHERE c.slug = 'airbnb'

UNION ALL

SELECT c.id, 'coding', 'hard', 'alien Dictionary',
    'Given a dictionary of alien words sorted lexicographically, return the order of the alphabet.',
    ARRAY['Build graph from comparisons', 'Use topological sort', 'Detect cycles'],
    ARRAY['graphs', 'topological_sort', 'strings']
FROM companies c WHERE c.slug = 'airbnb';

-- Behavioral - Airbnb
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'behavioral', 'medium', 'Customer Obsession - Tell Me About a Time',
    'Tell me about a time when you went above and beyond for a customer or guest.',
    ARRAY['Show empathy', 'Demonstrate ownership', 'Show impact'],
    ARRAY['customer_ obsession', 'service', 'ownership']
FROM companies c WHERE c.slug = 'airbnb'

UNION ALL

SELECT c.id, 'behavioral', 'medium', 'Why Airbnb?',
    'Why do you want to work at Airbnb?',
    ARRAY['Show travel interest', 'Know Belong Anywhere', 'Show community focus'],
    ARRAY['motivation', 'culture', 'travel']
FROM companies c WHERE c.slug = 'airbnb';

-- =====================================================
-- UBER QUESTIONS
-- =====================================================

-- System Design - Uber
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'system_design', 'hard', 'Design Uber',
    'Design a ride-sharing platform like Uber. Handle driver matching, real-time tracking, and surge pricing.',
    ARRAY['Matching algorithm', 'Geospatial queries', 'Real-time updates'],
    ARRAY['real_time', 'matching', 'geospatial', 'marketplace']
FROM companies c WHERE c.slug = 'uber'

UNION ALL

SELECT c.id, 'system_design', 'medium', 'Design Uber Eats',
    'Design a food delivery platform like Uber Eats. Handle restaurant, delivery, and tracking.',
    ARRAY['Delivery matching', 'Real-time tracking', 'Restaurant integration'],
    ARRAY['marketplace', 'real_time', 'tracking']
FROM companies c WHERE c.slug = 'uber'

UNION ALL

SELECT c.id, 'system_design', 'medium', 'Design Driver Allocation',
    'Design a system to allocate drivers to riders efficiently.',
    ARRAY['Geospatial indexing', 'ETA calculations', 'Load balancing'],
    ARRAY['matching', 'geospatial', 'optimization']
FROM companies c WHERE c.slug = 'uber';

-- Coding - Uber
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'coding', 'medium', 'Moving Average from Data Stream',
    'Design a data structure that supports adding numbers and retrieving the moving average.',
    ARRAY['Use queue or sliding window', 'O(1) average calculation'],
    ARRAY['data_structures', 'sliding_window', 'queues']
FROM companies c WHERE c.slug = 'uber'

UNION ALL

SELECT c.id, 'coding', 'medium', 'Encode and Decode TinyURL',
    'Design a URL encoding/decoding scheme for a tiny URL service.',
    ARRAY['Hash function', 'Database design', 'Collision handling'],
    ARRAY['system_design', 'encoding', 'database']
FROM companies c WHERE c.slug = 'uber'

UNION ALL

SELECT c.id, 'coding', 'hard', 'Trip Planning for Autonomous Vehicles',
    'Design an algorithm to plan optimal routes for autonomous vehicles.',
    ARRAY['Graph algorithms', 'Consider constraints', 'Dynamic programming'],
    ARRAY['graphs', 'routing', 'optimization']
FROM companies c WHERE c.slug = 'uber';

-- Behavioral - Uber
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'behavioral', 'medium', 'Tell Me About a Time You Dealt with Ambiguity',
    'Describe a time when you had to make a decision with incomplete information.',
    ARRAY['Show judgment', 'Demonstrate learning', 'Show accountability'],
    ARRAY['decision_making', 'ambiguity', 'leadership']
FROM companies c WHERE c.slug = 'uber'

UNION ALL

SELECT c.id, 'behavioral', 'medium', 'Why Uber?',
    'Why do you want to work at Uber?',
    ARRAY['Show transportation interest', 'Know Uber''s mission', 'Show impact focus'],
    ARRAY['motivation', 'innovation', 'impact']
FROM companies c WHERE c.slug = 'uber';

-- =====================================================
-- TWITTER QUESTIONS
-- =====================================================

-- System Design - Twitter
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'system_design', 'hard', 'Design Twitter Timeline',
    'Design Twitter''s home timeline. Handle tweets, follows, and real-time updates.',
    ARRAY['Pull vs push models', 'Fan-out strategy', 'Cache timeline'],
    ARRAY['feeds', 'real_time', 'caching', 'database']
FROM companies c WHERE c.slug = 'twitter'

UNION ALL

SELECT c.id, 'system_design', 'medium', 'Design Search for Tweets',
    'Design a search system for tweets. Handle full-text search and ranking.',
    ARRAY['Inverted index', 'Ranking algorithm', 'Real-time indexing'],
    ARRAY['search', 'indexing', 'ranking']
FROM companies c WHERE c.slug = 'twitter'

UNION ALL

SELECT c.id, 'system_design', 'medium', 'Design Trending Topics',
    'Design a system to identify and display trending topics on Twitter.',
    ARRAY['Time-windowed aggregation', 'Hashtag tracking', 'Ranking algorithm'],
    ARRAY['analytics', 'real_time', 'trending']
FROM companies c WHERE c.slug = 'twitter';

-- Coding - Twitter
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'coding', 'medium', 'Implement Twitter Timeline',
    'Design and implement a data structure to maintain a Twitter feed.',
    ARRAY['Priority queue', 'Merge k sorted lists', 'Time-based ordering'],
    ARRAY['data_structures', 'priority_queue', 'design']
FROM companies c WHERE c.slug = 'twitter'

UNION ALL

SELECT c.id, 'coding', 'medium', 'Binary Tree Right Side View',
    'Given the root of a binary tree, return the right side view of the tree.',
    ARRAY['Use BFS or DFS', 'Track levels', 'Rightmost node per level'],
    ARRAY['trees', 'bfs', 'dfs', 'traversal']
FROM companies c WHERE c.slug = 'twitter'

UNION ALL

SELECT c.id, 'coding', 'hard', 'Word Ladder',
    'Given two words beginWord and endWord, find the length of the shortest transformation sequence.',
    ARRAY['BFS approach', 'Build adjacency from patterns', 'Use set for visited'],
    ARRAY['graphs', 'bfs', 'strings', 'transformation']
FROM companies c WHERE c.slug = 'twitter';

-- Behavioral - Twitter
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'behavioral', 'medium', 'Tell Me About a Time You Had to Deliver Under Pressure',
    'Describe a time when you had to deliver a project under tight deadlines.',
    ARRAY['Show time management', 'Demonstrate prioritization', 'Show results'],
    ARRAY['time_management', 'pressure', 'delivery']
FROM companies c WHERE c.slug = 'twitter'

UNION ALL

SELECT c.id, 'behavioral', 'medium', 'Why Twitter?',
    'Why do you want to work at Twitter?',
    ARRAY['Show public platform interest', 'Know Twitter culture', 'Show conversation interest'],
    ARRAY['motivation', 'public_voice', 'impact']
FROM companies c WHERE c.slug = 'twitter';

-- =====================================================
-- LINKEDIN QUESTIONS
-- =====================================================

-- System Design - LinkedIn
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'system_design', 'hard', 'Design LinkedIn Network',
    'Design LinkedIn''s professional network. Handle connections, degrees of separation, and recommendations.',
    ARRAY['Graph storage', 'Connection suggestions', 'Privacy settings'],
    ARRAY['graphs', 'networking', 'recommendations']
FROM companies c WHERE c.slug = 'linkedin'

UNION ALL

SELECT c.id, 'system_design', 'medium', 'Design Job Search',
    'Design a job search system like LinkedIn. Handle listings, search, and applications.',
    ARRAY['Search indexing', 'Recommendation algorithm', 'Application tracking'],
    ARRAY['search', 'marketplace', 'recommendations']
FROM companies c WHERE c.slug = 'linkedin'

UNION ALL

SELECT c.id, 'system_design', 'medium', 'Design Feed System',
    'Design LinkedIn''s news feed. Handle content ranking and personalization.',
    ARRAY['Ranking signals', 'Content types', 'Engagement metrics'],
    ARRAY['feeds', 'ranking', 'personalization']
FROM companies c WHERE c.slug = 'linkedin';

-- Coding - LinkedIn
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'coding', 'medium', 'Merge K Sorted Arrays',
    'Merge k sorted arrays into one sorted array.',
    ARRAY['Use min-heap', 'O(N log k) complexity'],
    ARRAY['heap', 'merge_sort', 'arrays']
FROM companies c WHERE c.slug = 'linkedin'

UNION ALL

SELECT c.id, 'coding', 'medium', 'Shortest Path in Binary Matrix',
    'Find the shortest path from top-left to bottom-right in a binary matrix.',
    ARRAY['Use BFS', 'Consider diagonal moves', 'Handle obstacles'],
    ARRAY['graphs', 'bfs', 'matrix', 'shortest_path']
FROM companies c WHERE c.slug = 'linkedin'

UNION ALL

SELECT c.id, 'coding', 'hard', 'Serialize and Deserialize Binary Tree',
    'Serialize and deserialize a binary tree into a string representation.',
    ARRAY['Preorder traversal', 'Handle nulls', 'Delimiter choice'],
    ARRAY['trees', 'serialization', 'bfs', 'dfs']
FROM companies c WHERE c.slug = 'linkedin';

-- Behavioral - LinkedIn
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'behavioral', 'medium', 'Tell Me About a Time You Built Something from Scratch',
    'Describe a time when you built something from the ground up. What was the challenge?',
    ARRAY['Show initiative', 'Demonstrate end-to-end ownership', 'Show results'],
    ARRAY['ownership', 'initiative', 'building']
FROM companies c WHERE c.slug = 'linkedin'

UNION ALL

SELECT c.id, 'behavioral', 'medium', 'Why LinkedIn?',
    'Why do you want to work at LinkedIn?',
    ARRAY['Show professional network interest', 'Know LinkedIn mission', 'Show impact on professionals'],
    ARRAY['motivation', 'professional_network', 'impact']
FROM companies c WHERE c.slug = 'linkedin';

-- =====================================================
-- SPOTIFY QUESTIONS
-- =====================================================

-- System Design - Spotify
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'system_design', 'hard', 'Design Spotify Music Streaming',
    'Design a music streaming service like Spotify. Handle audio delivery, playlists, and recommendations.',
    ARRAY['Audio encoding', 'Playlist generation', 'Offline playback'],
    ARRAY['streaming', 'audio', 'recommendations', 'cdn']
FROM companies c WHERE c.slug = 'spotify'

UNION ALL

SELECT c.id, 'system_design', 'medium', 'Design Music Recommendation',
    'Design a music recommendation system. Handle user preferences and discoverability.',
    ARRAY['Collaborative filtering', 'Content analysis', 'Fresh content handling'],
    ARRAY['recommendations', 'ml', 'personalization']
FROM companies c WHERE c.slug = 'spotify';

-- Coding - Spotify
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'coding', 'medium', 'Shuffle an Array',
    'Given an array of integers, implement the Fisher-Yates shuffle algorithm.',
    ARRAY['In-place shuffling', 'Uniform distribution'],
    ARRAY['arrays', 'randomization', 'algorithms']
FROM companies c WHERE c.slug = 'spotify'

UNION ALL

SELECT c.id, 'coding', 'medium', 'Kth Largest Element',
    'Find the kth largest element in an unsorted array.',
    ARRAY['Use quickselect', 'Consider heap approach'],
    ARRAY['arrays', 'sorting', 'quickselect', 'heap']
FROM companies c WHERE c.slug = 'spotify';

-- Behavioral - Spotify
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'behavioral', 'medium', 'Tell Me About a Time You Improved Something',
    'Describe a time when you identified an improvement and drove its implementation.',
    ARRAY['Show initiative', 'Demonstrate impact', 'Show data-driven approach'],
    ARRAY['improvement', 'ownership', 'data']
FROM companies c WHERE c.slug = 'spotify'

UNION ALL

SELECT c.id, 'behavioral', 'medium', 'Why Spotify?',
    'Why do you want to work at Spotify?',
    ARRAY['Show music interest', 'Know Spotify culture', 'Show passion for audio'],
    ARRAY['motivation', 'music', 'culture']
FROM companies c WHERE c.slug = 'spotify';

-- =====================================================
-- DROPBOX QUESTIONS
-- =====================================================

-- System Design - Dropbox
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'system_design', 'hard', 'Design Dropbox',
    'Design a file storage and synchronization service like Dropbox. Handle cloud storage and sync.',
    ARRAY['Delta sync', 'Conflict resolution', 'Encryption'],
    ARRAY['storage', 'sync', 'encryption', 'file_systems']
FROM companies c WHERE c.slug = 'dropbox'

UNION ALL

SELECT c.id, 'system_design', 'medium', 'Design File Sharing',
    'Design a file sharing system. Handle permissions and version history.',
    ARRAY['Access control', 'Versioning', 'Audit logs'],
    ARRAY['storage', 'permissions', 'versioning']
FROM companies c WHERE c.slug = 'dropbox';

-- Coding - Dropbox
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'coding', 'medium', 'File Directory Problem',
    'Design a file system with directory operations.',
    ARRAY['Use tree structure', 'Handle path parsing'],
    ARRAY['design', 'trees', 'file_systems']
FROM companies c WHERE c.slug = 'dropbox'

UNION ALL

SELECT c.id, 'coding', 'hard', 'Range Sum Query',
    'Design a data structure that supports range sum queries.',
    ARRAY['Use prefix sums', 'Consider segment tree'],
    ARRAY['data_structures', 'segment_tree', 'arrays']
FROM companies c WHERE c.slug = 'dropbox';

-- Behavioral - Dropbox
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'behavioral', 'medium', 'Tell Me About a Time You Solved a Complex Problem',
    'Describe a complex technical problem you solved.',
    ARRAY['Show technical depth', 'Demonstrate problem-solving', 'Show impact'],
    ARRAY['technical', 'problem_solving', 'depth']
FROM companies c WHERE c.slug = 'dropbox';

-- =====================================================
-- SLACK QUESTIONS
-- =====================================================

-- System Design - Slack
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'system_design', 'hard', 'Design Slack',
    'Design a messaging platform like Slack. Handle channels, DMs, and real-time updates.',
    ARRAY['WebSocket handling', 'Message persistence', 'Channel management'],
    ARRAY['messaging', 'real_time', 'database', 'concurrency']
FROM companies c WHERE c.slug = 'slack'

UNION ALL

SELECT c.id, 'system_design', 'medium', 'Design Search in Slack',
    'Design a search functionality for Slack. Handle message search and filtering.',
    ARRAY['Full-text search', 'Index optimization', 'Access control in search'],
    ARRAY['search', 'indexing', 'permissions']
FROM companies c WHERE c.slug = 'slack';

-- Coding - Slack
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'coding', 'medium', 'Implement Chat Message Queue',
    'Design a message queue for chat messages with delivery guarantees.',
    ARRAY['Message ordering', 'Acknowledgment system', 'Retry logic'],
    ARRAY['queues', 'messaging', 'design']
FROM companies c WHERE c.slug = 'slack'

UNION ALL

SELECT c.id, 'coding', 'medium', 'Emoji Reaction System',
    'Design a system for emoji reactions on messages.',
    ARRAY['Database design', 'Real-time updates'],
    ARRAY['database', 'real_time', 'design']
FROM companies c WHERE c.slug = 'slack';

-- Behavioral - Slack
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'behavioral', 'medium', 'Tell Me About a Time You Improved Developer Experience',
    'Describe a time when you improved developer experience or tooling.',
    ARRAY['Show empathy for developers', 'Demonstrate tooling skills', 'Show impact on productivity'],
    ARRAY['developer_experience', 'tooling', 'communication']
FROM companies c WHERE c.slug = 'slack';

-- =====================================================
-- ZOOM QUESTIONS
-- =====================================================

-- System Design - Zoom
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'system_design', 'hard', 'Design Zoom',
    'Design a video conferencing platform like Zoom. Handle video, audio, and screen sharing.',
    ARRAY['WebRTC', 'SFU vs MCU', 'Quality adaptation'],
    ARRAY['video', 'webrtc', 'real_time', 'conferencing']
FROM companies c WHERE c.slug = 'zoom'

UNION ALL

SELECT c.id, 'system_design', 'medium', 'Design Recording System',
    'Design a system to record and playback video meetings.',
    ARRAY['Recording format', 'Storage', 'Playback'],
    ARRAY['video', 'storage', 'streaming']
FROM companies c WHERE c.slug = 'zoom';

-- Coding - Zoom
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'coding', 'hard', 'Implement Video Quality Adaptation',
    'Implement an algorithm for adaptive bitrate streaming.',
    ARRAY['Bandwidth detection', 'Quality levels', 'Switching logic'],
    ARRAY['algorithms', 'video', 'adaptive']
FROM companies c WHERE c.slug = 'zoom'

UNION ALL

SELECT c.id, 'coding', 'medium', 'Meeting Code Generation',
    'Generate unique meeting codes that are easy to share but hard to guess.',
    ARRAY['Hash function', 'Collision handling'],
    ARRAY['strings', 'randomization', 'encoding']
FROM companies c WHERE c.slug = 'zoom';

-- Behavioral - Zoom
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'behavioral', 'medium', 'Tell Me About a Time You Worked on Real-Time Systems',
    'Describe your experience working on real-time systems.',
    ARRAY['Show real-time experience', 'Demonstrate latency optimization', 'Show reliability focus'],
    ARRAY['real_time', 'performance', 'reliability']
FROM companies c WHERE c.slug = 'zoom';

-- =====================================================
-- COINBASE QUESTIONS
-- =====================================================

-- System Design - Coinbase
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'system_design', 'hard', 'Design a Crypto Exchange',
    'Design a cryptocurrency exchange like Coinbase. Handle orders, wallets, and security.',
    ARRAY['Order matching', 'Wallet management', 'Security considerations'],
    ARRAY['fintech', 'trading', 'security', 'storage']
FROM companies c WHERE c.slug = 'coinbase'

UNION ALL

SELECT c.id, 'system_design', 'hard', 'Design Blockchain Explorer',
    'Design a blockchain explorer. Handle transaction lookup and visualization.',
    ARRAY['Block indexing', 'Transaction tracking', 'API design'],
    ARRAY['blockchain', 'indexing', 'api_design']
FROM companies c WHERE c.slug = 'coinbase';

-- Coding - Coinbase
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'coding', 'hard', 'Implement a Simple Blockchain',
    'Implement a basic blockchain with proof of work.',
    ARRAY['Hash calculation', 'Mining', 'Chain validation'],
    ARRAY['blockchain', 'cryptography', 'algorithms']
FROM companies c WHERE c.slug = 'coinbase'

UNION ALL

SELECT c.id, 'coding', 'medium', 'Transaction Fee Calculator',
    'Calculate optimal transaction fees based on network congestion.',
    ARRAY['Fee market', 'Priority calculation'],
    ARRAY['algorithms', 'fintech', 'optimization']
FROM companies c WHERE c.slug = 'coinbase';

-- Behavioral - Coinbase
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'behavioral', 'medium', 'Tell Me About Compliance and Security',
    'Describe a time when you had to balance security with user experience.',
    ARRAY['Show security mindset', 'Demonstrate compliance awareness', 'Show user empathy'],
    ARRAY['security', 'compliance', 'ux']
FROM companies c WHERE c.slug = 'coinbase';

-- =====================================================
-- BLOOMBERG QUESTIONS
-- =====================================================

-- System Design - Bloomberg
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'system_design', 'hard', 'Design Financial Data Feed',
    'Design a real-time financial data feed system. Handle high-frequency updates.',
    ARRAY['Low latency', 'Data compression', 'Distribution'],
    ARRAY['real_time', 'fintech', 'low_latency', 'distribution']
FROM companies c WHERE c.slug = 'bloomberg'

UNION ALL

SELECT c.id, 'system_design', 'hard', 'Design Stock Trading Platform',
    'Design a stock trading platform. Handle orders and market data.',
    ARRAY['Order processing', 'Market data', 'Risk management'],
    ARRAY['trading', 'fintech', 'real_time', 'risk']
FROM companies c WHERE c.slug = 'bloomberg';

-- Coding - Bloomberg
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'coding', 'hard', 'High Frequency Trading Algorithm',
    'Implement a simple high-frequency trading algorithm.',
    ARRAY['Market data processing', 'Signal generation', 'Order execution'],
    ARRAY['algorithms', 'trading', 'fintech']
FROM companies c WHERE c.slug = 'bloomberg'

UNION ALL

SELECT c.id, 'coding', 'medium', 'Stock Price Aggregator',
    'Aggregate stock prices from multiple sources.',
    ARRAY['Handle inconsistencies', 'Weighted average', 'Outlier detection'],
    ARRAY['algorithms', 'data_aggregation', 'fintech']
FROM companies c WHERE c.slug = 'bloomberg';

-- Behavioral - Bloomberg
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'behavioral', 'medium', 'Tell Me About Working with Financial Data',
    'Describe your experience working with financial data.',
    ARRAY['Show attention to detail', 'Demonstrate data accuracy focus', 'Show domain knowledge'],
    ARRAY['fintech', 'data', 'accuracy']
FROM companies c WHERE c.slug = 'bloomberg';

-- =====================================================
-- DOORDASH QUESTIONS
-- =====================================================

-- System Design - DoorDash
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'system_design', 'hard', 'Design DoorDash Delivery',
    'Design a food delivery platform like DoorDash. Handle orders, dispatch, and tracking.',
    ARRAY['Delivery matching', 'Real-time tracking', 'Route optimization'],
    ARRAY['marketplace', 'real_time', 'optimization', 'matching']
FROM companies c WHERE c.slug = 'doordash'

UNION ALL

SELECT c.id, 'system_design', 'medium', 'Design Restaurant Management',
    'Design a system for restaurants to manage orders and menu.',
    ARRAY['Menu updates', 'Order handling', 'Availability'],
    ARRAY['restaurant', 'management', 'database']
FROM companies c WHERE c.slug = 'doordash';

-- Coding - DoorDash
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'coding', 'medium', 'Delivery Route Optimization',
    'Find the optimal route for deliveries.',
    ARRAY['Traveling salesman', 'Time windows', 'Consider constraints'],
    ARRAY['algorithms', 'optimization', 'routing']
FROM companies c WHERE c.slug = 'doordash'

UNION ALL

SELECT c.id, 'coding', 'medium', 'Estimate Delivery Time',
    'Estimate delivery time based on distance and other factors.',
    ARRAY['Machine learning', 'Historical data', 'Real-time factors'],
    ARRAY['algorithms', 'estimation', 'ml']
FROM companies c WHERE c.slug = 'doordash';

-- Behavioral - DoorDash
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'behavioral', 'medium', 'Tell Me About a Time You Optimized for Scale',
    'Describe a time when you optimized a system for scale.',
    ARRAY['Show scalability focus', 'Demonstrate performance optimization', 'Show impact'],
    ARRAY['scalability', 'performance', 'optimization']
FROM companies c WHERE c.slug = 'doordash';

-- =====================================================
-- SNAP QUESTIONS
-- =====================================================

-- System Design - Snap
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'system_design', 'hard', 'Design Snapchat',
    'Design a social media platform like Snapchat. Handle ephemeral messages and stories.',
    ARRAY['Snap expiration', 'Story timeline', 'Media storage'],
    ARRAY['messaging', 'media', 'storage', 'social']
FROM companies c WHERE c.slug = 'snap'

UNION ALL

SELECT c.id, 'system_design', 'medium', 'Design AR Features',
    'Design an AR feature system. Handle image processing and overlay.',
    ARRAY['Computer vision', 'Image overlay', 'Real-time processing'],
    ARRAY['ar', 'computer_vision', 'image_processing']
FROM companies c WHERE c.slug = 'snap';

-- Coding - Snap
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'coding', 'medium', 'Image Filter Processing',
    'Implement basic image filter processing.',
    ARRAY['Convolution', 'Pixel manipulation'],
    ARRAY['image_processing', 'algorithms', 'arrays']
FROM companies c WHERE c.slug = 'snap'

UNION ALL

SELECT c.id, 'coding', 'medium', 'Snap Expiration System',
    'Design a system to handle expiring content.',
    ARRAY['Timer management', 'Cleanup jobs'],
    ARRAY['system_design', 'scheduling', 'storage']
FROM companies c WHERE c.slug = 'snap';

-- Behavioral - Snap
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'behavioral', 'medium', 'Tell Me About Working on Creative Products',
    'Describe your experience working on creative or consumer products.',
    ARRAY['Show creativity', 'Demonstrate user focus', 'Show innovation'],
    ARRAY['creativity', 'consumer_products', 'innovation']
FROM companies c WHERE c.slug = 'snap';

-- =====================================================
-- PINTEREST QUESTIONS
-- =====================================================

-- System Design - Pinterest
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'system_design', 'hard', 'Design Pinterest',
    'Design an image discovery platform like Pinterest. Handle pins, boards, and recommendations.',
    ARRAY['Image storage', 'Recommendation engine', 'Search'],
    ARRAY['images', 'recommendations', 'search', 'social']
FROM companies c WHERE c.slug = 'pinterest'

UNION ALL

SELECT c.id, 'system_design', 'medium', 'Design Image Search',
    'Design an image search system. Handle visual search and classification.',
    ARRAY['Image features', 'Similarity search', 'Classification'],
    ARRAY['search', 'computer_vision', 'ml']
FROM companies c WHERE c.slug = 'pinterest';

-- Coding - Pinterest
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'coding', 'medium', 'Similar Image Detection',
    'Detect similar images in a collection.',
    ARRAY['Hashing approach', 'Feature comparison'],
    ARRAY['algorithms', 'image_processing', 'hashing']
FROM companies c WHERE c.slug = 'pinterest'

UNION ALL

SELECT c.id, 'coding', 'medium', 'Pin Recommendation',
    'Recommend pins based on user interests.',
    ARRAY['Collaborative filtering', 'Content-based filtering'],
    ARRAY['recommendations', 'ml', 'algorithms']
FROM companies c WHERE c.slug = 'pinterest';

-- Behavioral - Pinterest
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT c.id, 'behavioral', 'medium', 'Tell Me About a Time You Designed for Users',
    'Describe a time when you designed something with the user in mind.',
    ARRAY['Show user empathy', 'Demonstrate design thinking', 'Show data-driven decisions'],
    ARRAY['ux', 'design', 'user_research']
FROM companies c WHERE c.slug = 'pinterest';

-- =====================================================
-- ADD MORE GENERAL QUESTIONS (NO COMPANY)
-- =====================================================

-- General System Design Questions
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT NULL::uuid, 'system_design', 'medium', 'Design a Rate Limiter',
    'Design a rate limiter to prevent abuse. Consider distributed systems.',
    ARRAY['Token bucket', 'Sliding window', 'Redis implementation'],
    ARRAY['api_design', 'rate_limiting', 'distributed_systems']

UNION ALL

SELECT NULL::uuid, 'system_design', 'medium', 'Design a Message Queue',
    'Design a message queue system like RabbitMQ or Kafka.',
    ARRAY['Pub/sub model', 'Persistence', 'Delivery guarantees'],
    ARRAY['messaging', 'queues', 'distributed_systems']

UNION ALL

SELECT NULL::uuid, 'system_design', 'medium', 'Design a Distributed Lock',
    'Design a distributed locking mechanism for coordinating resources.',
    ARRAY['Redis-based locks', 'ZooKeeper', 'CAP theorem considerations'],
    ARRAY['distributed_systems', 'locking', 'coordination']

UNION ALL

SELECT NULL::uuid, 'system_design', 'hard', 'Design a Metrics Collection System',
    'Design a system to collect and aggregate metrics from distributed services.',
    ARRAY['Time-series data', 'Aggregation', 'Visualization'],
    ARRAY['monitoring', 'metrics', 'distributed_systems']

UNION ALL

SELECT NULL::uuid, 'system_design', 'hard', 'Design an API Gateway',
    'Design an API gateway for microservices. Handle routing, auth, and rate limiting.',
    ARRAY['Request routing', 'Authentication', 'Logging'],
    ARRAY['api_gateway', 'microservices', 'security'];

-- General Coding Questions
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT NULL::uuid, 'coding', 'easy', 'Reverse a String',
    'Reverse a string in-place.',
    ARRAY['Two pointers', 'In-place swap'],
    ARRAY['strings', 'two_pointers', 'in_place']

UNION ALL

SELECT NULL::uuid, 'coding', 'easy', 'FizzBuzz',
    'Print numbers from 1 to n. For multiples of 3 print Fizz, for multiples of 5 print Buzz.',
    ARRAY['Modulo operator', 'String concatenation'],
    ARRAY['basic', 'loops', 'strings']

UNION ALL

SELECT NULL::uuid, 'coding', 'medium', 'Find the Missing Number',
    'Given an array containing n-1 distinct numbers from 1 to n, find the missing number.',
    ARRAY['Sum formula', 'XOR approach'],
    ARRAY['arrays', 'math', 'bit_manipulation']

UNION ALL

SELECT NULL::uuid, 'coding', 'medium', 'Maximum Subarray',
    'Find the contiguous subarray with the largest sum.',
    ARRAY['Kadane algorithm', 'Dynamic programming'],
    ARRAY['arrays', 'dynamic_programming', 'kadane']

UNION ALL

SELECT NULL::uuid, 'coding', 'medium', 'Climbing Stairs',
    'You are climbing n stairs. Each time you can climb 1 or 2 steps. How many distinct ways?',
    ARRAY['Dynamic programming', 'Fibonacci relationship'],
    ARRAY['dynamic_programming', 'recursion', 'math']

UNION ALL

SELECT NULL::uuid, 'coding', 'medium', 'Coin Change',
    'Given coin denominations and a target amount, find the minimum number of coins needed.',
    ARRAY['Dynamic programming', 'Unbounded knapsack'],
    ARRAY['dynamic_programming', 'algorithms', 'optimization']

UNION ALL

SELECT NULL::uuid, 'coding', 'medium', 'Longest Common Subsequence',
    'Find the length of the longest common subsequence between two strings.',
    ARRAY['Dynamic programming 2D', 'Space optimization possible'],
    ARRAY['dynamic_programming', 'strings', 'algorithms']

UNION ALL

SELECT NULL::uuid, 'coding', 'hard', 'Maximum Profit in Stock Trading',
    'Find the maximum profit from buying and selling stocks with at most one transaction.',
    ARRAY['Single pass', 'Track minimum price'],
    ARRAY['arrays', 'dynamic_programming', 'greedy']

UNION ALL

SELECT NULL::uuid, 'coding', 'hard', 'Word Break II',
    'Given a string and a dictionary, return all possible sentence segmentations.',
    ARRAY['Dynamic programming', 'Backtracking', 'Memoization'],
    ARRAY['strings', 'dynamic_programming', 'backtracking'];

-- General Behavioral Questions
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT NULL::uuid, 'behavioral', 'easy', 'Tell Me About Yourself',
    'Walk me through your background and experience.',
    ARRAY['Structure your response', 'Highlight relevant experience', 'Be concise'],
    ARRAY['communication', 'storytelling', 'self_awareness']

UNION ALL

SELECT NULL::uuid, 'behavioral', 'easy', 'Why Do You Want to Be a Software Engineer?',
    'Why are you interested in software engineering?',
    ARRAY['Show passion', 'Share your story', 'Be genuine'],
    ARRAY['motivation', 'passion', 'self_awareness']

UNION ALL

SELECT NULL::uuid, 'behavioral', 'medium', 'Tell Me About a Project You Are Proud Of',
    'Describe a project you worked on that you are particularly proud of.',
    ARRAY['Use STAR method', 'Show impact', 'Demonstrate learning'],
    ARRAY['projects', 'achievements', 'communication']

UNION ALL

SELECT NULL::uuid, 'behavioral', 'medium', 'Tell Me About a Time You Failed',
    'Describe a time when you failed. What did you learn?',
    ARRAY['Be honest', 'Show learning', 'Demonstrate growth'],
    ARRAY['self_awareness', 'learning', 'growth_mindset']

UNION ALL

SELECT NULL::uuid, 'behavioral', 'medium', 'Tell Me About a Time You Had a Conflict with a Team Member',
    'Describe a conflict with a coworker and how you resolved it.',
    ARRAY['Show empathy', 'Focus on resolution', 'Demonstrate communication'],
    ARRAY['conflict_resolution', 'teamwork', 'communication']

UNION ALL

SELECT NULL::uuid, 'behavioral', 'medium', 'Tell Me About a Time You Had to Meet a Tight Deadline',
    'Describe a time when you had to deliver under pressure.',
    ARRAY['Show time management', 'Demonstrate prioritization', 'Show results'],
    ARRAY['time_management', 'pressure', 'delivery']

UNION ALL

SELECT NULL::uuid, 'behavioral', 'medium', 'What Are Your Strengths and Weaknesses?',
    'Discuss your technical and interpersonal strengths and weaknesses.',
    ARRAY['Be honest', 'Show self-awareness', 'Demonstrate improvement efforts'],
    ARRAY['self_awareness', 'communication', 'growth_mindset']

UNION ALL

SELECT NULL::uuid, 'behavioral', 'hard', 'Where Do You See Yourself in 5 Years?',
    'Where do you see your career heading in the next 5 years?',
    ARRAY['Show ambition', 'Demonstrate planning', 'Align with company'],
    ARRAY['career', 'planning', 'motivation']

UNION ALL

SELECT NULL::uuid, 'behavioral', 'medium', 'Tell Me About a Time You Disagreed with a Decision',
    'Describe when you disagreed with a technical or business decision.',
    ARRAY['Show respect', 'Demonstrate data-driven approach', 'Show outcome'],
    ARRAY['communication', 'leadership', 'problem_solving'];

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_interview_questions_company_null ON interview_questions(company_id) WHERE company_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_questions_type_difficulty ON interview_questions(type, difficulty);

