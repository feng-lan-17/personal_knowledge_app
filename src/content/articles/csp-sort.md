这是原创教程示例。默认你已经能用 `vector` 读入一列数。这里不运行代码。

## 排序是为了让后面的查找变便宜

无序数组里找一个数，最坏要看完，\(O(n)\)。排好以后可以二分，\(O(\log n)\)。C++ 里对 `vector` 排序：

```cpp
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];
    sort(a.begin(), a.end());
    a.erase(unique(a.begin(), a.end()), a.end());
    for (int x : a) cout << x << " ";
    cout << "\n";
    return 0;
}
```

`unique` 只把相邻的重复项挤到后面，所以必须先排序。它不负责删短容器，要配合 `erase`。比较函数若自己写，必须满足严格弱序：相等时两边都不要返回 true。违反这一点会让 `sort` 的行为无法预期。

`sort` 的时间是 \(O(n \log n)\)。\(n = 10^5\) 时这通常可以接受，两层冒泡则不行。入门不必手写快排，先把标准库用对。

## 二分找的是边界，不是“大概在中间”

在非降序数组里找第一个大于等于 `x` 的位置，可以用半开区间 `[l, r)`：

```cpp
int lower_bound_index(const vector<int>& a, int x) {
    int l = 0;
    int r = static_cast<int>(a.size());
    while (l < r) {
        int m = l + (r - l) / 2;
        if (a[m] < x) l = m + 1;
        else r = m;
    }
    return l;
}
```

循环结束时 `l` 就是答案；若 `l == a.size()`，说明所有元素都小于 `x`。标准库的 `std::lower_bound` 做的是同一件事，返回迭代器。数组没有排序时不要用它，它不会替你检查。

常见错误：

- 写成 `while (l < r)` 却在分支里令 `l = m` 或 `r = m`，中点不再前进，死循环。
- 用 `(l + r) / 2`，`l` 和 `r` 都很大时可能溢出。上面的写法避开了这一点。
- 在开闭区间之间来回抄代码，不画一次长度为 2 的例子。

手算一次：`a = [1, 3, 3, 8]`，`x = 3`。第一次中点落在 3 上，因为不小于 `x`，右端收到中点；最后 `l` 停在第一个 3。这个数组是讲解用的，不是题目样例。

## 模拟题也可以先排序

有些题的过程本身很直白，但若按输入顺序做会很麻烦。先排序，再线性扫一遍，复杂度就从“想不清楚”变成 \(O(n \log n)\)。判断的标准仍然是：你能否用自己的话把步骤讲完。讲不完就还不是模拟，只是在试。

## 拆题的顺序

1. 用最小的例子把输入和输出各写一行，确认自己理解的是题面，而不是回忆。
2. 问数据范围，决定枚举、排序还是二分。
3. 先写读入和一个断言式的输出，再填中间。
4. 专门检查：空数组、只有一个元素、全部相等、答案在两端。

洛谷上可以拿来练手的真实题目入口（题面以原站为准，此处不复制）：

- [P1001 A+B Problem](https://www.luogu.com.cn/problem/P1001)，确认输入输出。
- [P1047](https://www.luogu.com.cn/problem/P1047)，区间模拟。页面上的题名以洛谷显示为准。

## 参考

排序与二分是标准库和算法教材里的公共知识。本篇代码是原创示例，不对应某份题解的版权文本。
