export interface ProblemEntry {
  id: string
  title: string
  tags: string[]
  source: string
  url: string
  topic: "io" | "sim" | "sort" | "search" | "dp"
  observation: string
  hint: string
  derivation: string
  complexity: string
  code: string
}

export const PROBLEM_TOPIC: Record<ProblemEntry["topic"], string> = {
  io: "输入输出",
  sim: "模拟",
  sort: "排序与二分",
  search: "搜索与图",
  dp: "动态规划",
}

export const PROBLEMS: ProblemEntry[] = [
  {
    id: "P1001",
    title: "A+B Problem",
    tags: ["输入输出"],
    source: "洛谷",
    url: "https://www.luogu.com.cn/problem/P1001",
    topic: "io",
    observation: "先确认能把两个整数读进来、再写出去。这一题不考查算法。",
    hint: "关掉同步之后不要再混用 scanf。和可能超过 int 时改用 long long。",
    derivation: "读入 a、b，输出 a + b。没有循环，也没有边界要枚举。",
    complexity: "时间 O(1)，空间 O(1)。",
    code: `#include <iostream>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    long long a, b;
    if (!(cin >> a >> b)) return 0;
    cout << a + b << "\\n";
    return 0;
}`,
  },
  {
    id: "P1047",
    title: "校门外的树",
    tags: ["模拟", "区间"],
    source: "洛谷",
    url: "https://www.luogu.com.cn/problem/P1047",
    topic: "sim",
    observation: "题面要你按区间做标记。先把「闭区间还是开区间」画在一条长度为 L 的线上，再写循环。",
    hint: "树的编号从 0 到 L，数组要开 L + 1。每一段移走的树只标记一次。",
    derivation: "用一个布尔数组表示树还在不在。每读入一段 [a, b]，把下标 a 到 b 标成移走。最后数还在的棵数。数据不大，直接模拟就够。",
    complexity: "设区间长度为 L、操作 m 次，时间 O(mL)，空间 O(L)。",
    code: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int L, m;
    cin >> L >> m;
    vector<char> alive(L + 1, 1);
    for (int i = 0; i < m; ++i) {
        int a, b;
        cin >> a >> b;
        for (int x = a; x <= b; ++x) alive[x] = 0;
    }
    int count = 0;
    for (char x : alive) count += x;
    cout << count << "\\n";
    return 0;
}`,
  },
  {
    id: "P1216",
    title: "数字三角形",
    tags: ["动态规划"],
    source: "洛谷",
    url: "https://www.luogu.com.cn/problem/P1216",
    topic: "dp",
    observation: "走到某一格时，它只能从左上或右上来。最后一行的最大值就是答案。",
    hint: "不存在的那一侧不要参加 max。格子从 1 编号还是从 0 编号，选定一种写到底。",
    derivation: "令 f[i][j] 为走到第 i 行第 j 个数的最大和。f[i][j] = g[i][j] + 从上面能到达的较大者。自顶向下填表即可。",
    complexity: "时间、空间都与格子数成正比，O(n²)。",
    code: `// 讲解用的转移，不是原题样例
// f[i][j] = g[i][j] + max(左上, 右上)
int from = 0;
if (j - 1 >= 1) from = max(from, f[i - 1][j - 1]);
if (j <= i - 1) from = max(from, f[i - 1][j]);
f[i][j] = g[i][j] + from;`,
  },
  {
    id: "P1443",
    title: "马的遍历",
    tags: ["广度优先搜索"],
    source: "洛谷",
    url: "https://www.luogu.com.cn/problem/P1443",
    topic: "search",
    observation: "马走日字，每一步代价相同。第一次到达某格的步数就是最少步数，用广度优先，不要用深度优先。",
    hint: "入队时就标记已访问。出队才标记会让同一格进队很多次。",
    derivation: "八个方向是 (1,2) 及其符号和轴交换。队列里放坐标和步数。越界或走过的格子跳过。",
    complexity: "棋盘 n×m，每格入队一次，时间 O(nm)。",
    code: `const int dx[] = {1, 1, -1, -1, 2, 2, -2, -2};
const int dy[] = {2, -2, 2, -2, 1, -1, 1, -1};
// 入队时写入 dist[nx][ny] = dist[x][y] + 1`,
  },
  {
    id: "P1048",
    title: "采药",
    tags: ["0/1 背包"],
    source: "洛谷",
    url: "https://www.luogu.com.cn/problem/P1048",
    topic: "dp",
    observation: "每株草最多采一次。问的是最后一件拿不拿，不是把同一件反复使用。",
    hint: "一维数组时，容量要从大到小更新，否则这件物品会被用两次。",
    derivation: "容量 j 从大到小：f[j] = max(f[j], f[j - w] + v)。这是 0/1 背包的滚动写法。",
    complexity: "时间 O(nW)，空间 O(W)。",
    code: `for (int i = 1; i <= n; ++i) {
    int w, v;
    cin >> w >> v;
    for (int j = W; j >= w; --j)
        f[j] = max(f[j], f[j - w] + v);
}`,
  },
]
