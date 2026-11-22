这是原创教程示例，给准备用 C++ 参加 CCF CSP 认证、目前还没有算法基础的人。目标分数 300/500 只说明后面的题目难度大致往哪里走，不是一份打卡计划。本库不能编译或评测代码。

CSP 认证卷面通常是五题、每题一百分。它和面向中学生的 CSP-J/S 不是同一场考试。下面借用一些普及组的练习入口，是因为那些题的类型适合热身，题面和数据以洛谷页面为准，这里不转载。

## 程序先要能读完输入

认证题的输入来自标准输入。入门阶段把下面三行当成习惯，并记住：关掉同步以后，不要再和 `scanf`、`printf` 混用。

```cpp
#include <iostream>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    if (!(cin >> n)) return 0;
    cout << n << "\n";
    return 0;
}
```

常见错误：

- 用 `endl` 换行。它会刷新输出，数据一大就慢。用 `"\n"`。
- 忘了读入失败。文件结束时仍按成功去用变量，后面的循环会乱。
- 和数有关的和、乘积用 `int`。两亿以上的中间结果要考虑 `long long`。

洛谷 P1001 是最普通的两数相加，适合只检查输入输出：[P1001](https://www.luogu.com.cn/problem/P1001)。

## 复杂度是在问“数据变大以后还来不来得及”

先记住两个够用的说法。一层循环扫过 \(n\) 个数，大约做 \(n\) 次工作，写成 \(O(n)\)。两层循环都扫到 \(n\)，大约是 \(O(n^2)\)。排序一般是 \(O(n \log n)\)。CSP 的时限多在一秒左右，\(n\) 到了 \(10^5\) 时，两层循环常常不够用；\(n\) 只有几百时，两层循环往往可以。

这不是精确的秒表。它用来在写之前决定：能不能直接枚举。枚举清楚，就不要先学一个记不住的高级名字。

## vector 和 string 先于其他容器

`vector<int> a(n)` 有 \(n\) 个位置，下标从 0 到 \(n-1\)。很多题目的编号从 1 开始，这时可以开 `n + 1`，不用下标 0，也可以读进来以后自己减一。选一种，写注释，不要混。

`string` 用来存一行不带空格的文本，或你已经读入的一整行。按字符遍历是 `for (char c : s)`。需要按下标改字符时，用 `s[i]`。

`map<Key, Value>` 按键有序，每次操作大约 \(O(\log n)\)。`unordered_map` 平均更快，最坏会退回很慢，入门先用 `map`，少一桩奇怪的超时。

下面这段统计每个字符串出现了几次。数据是讲解用的形状，不是某道题的样例。

```cpp
#include <iostream>
#include <map>
#include <string>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    map<string, int> count;
    for (int i = 0; i < n; ++i) {
        string word;
        cin >> word;
        count[word] += 1;
    }
    for (const auto& [word, times] : count) {
        cout << word << " " << times << "\n";
    }
    return 0;
}
```

常见错误：`vector` 用 `a[i]` 时 `i` 等于 `a.size()`，这是越界。`map` 的下标运算符会在键不存在时插入 0，只想查询时用 `find`。

## 模拟题在练什么

模拟就是按题目说的过程，用代码走一遍，不偷步。容易错的是边界：区间是闭的还是开的，最后一次操作之后还要不要输出。洛谷 P1047 是这类练习的一个真实入口，页面标题以洛谷为准：[P1047](https://www.luogu.com.cn/problem/P1047)。不要在没看题面时背一份“标准答案”。

## 这一篇之后

下一篇处理排序、二分和“把题拆成能写完的步骤”。图、搜索和简单动态规划放在第三篇。三篇是内容的顺序，不是必须连续打卡的天数。

## 参考

官方考试入口是 [CCF CSP](https://cspro.org/)。场次、大纲和任何分数线都以官网当时的页面为准，本库不转载通知。
