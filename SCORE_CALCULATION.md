# Performance Score Calculation - Detailed Explanation

## 📊 How the Score is Generated

The performance score is calculated on a **100-point scale**, starting at **100 points** and **deducting points** based on metric performance.

---

## 🎯 Score Calculation Formula

```
Final Score = 100 - (LCP Deduction + FID Deduction + CLS Deduction + FCP Deduction + TTI Deduction + TBT Deduction)
```

**Minimum Score**: 0 (all metrics poor/missing)  
**Maximum Score**: 100 (all metrics good)

---

## 📋 Detailed Scoring Breakdown

### 1. LCP (Largest Contentful Paint) - **25 Points Maximum**

**Weight**: 25% of total score (most important)

| LCP Value | Status | Points Deducted |
|-----------|--------|-----------------|
| ≤ 2.5 seconds | ✅ Good | 0 points |
| 2.5 - 4.0 seconds | ⚠️ Needs Improvement | -10 points |
| > 4.0 seconds | ❌ Poor | -25 points |
| Missing/Null | ❌ Missing | -15 points |

**Example**:
- LCP = 1.8s → **0 points deducted** (Good)
- LCP = 3.5s → **-10 points deducted** (Needs Improvement)
- LCP = 6.1s → **-25 points deducted** (Poor)
- LCP = null → **-15 points deducted** (Missing)

---

### 2. FID (First Input Delay) - **25 Points Maximum**

**Weight**: 25% of total score (most important)

| FID Value | Status | Points Deducted |
|-----------|--------|-----------------|
| ≤ 100ms | ✅ Good | 0 points |
| 100 - 300ms | ⚠️ Needs Improvement | -10 points |
| > 300ms | ❌ Poor | -25 points |
| Missing/Null | ℹ️ Not Applicable | 0 points |

**Note**: FID null is **acceptable** because it requires user interaction. No penalty for missing FID.

**Example**:
- FID = 50ms → **0 points deducted** (Good)
- FID = 200ms → **-10 points deducted** (Needs Improvement)
- FID = 500ms → **-25 points deducted** (Poor)
- FID = null → **0 points deducted** (Not Applicable - no user interaction)

---

### 3. CLS (Cumulative Layout Shift) - **25 Points Maximum**

**Weight**: 25% of total score (most important)

| CLS Value | Status | Points Deducted |
|-----------|--------|-----------------|
| ≤ 0.1 | ✅ Good | 0 points |
| 0.1 - 0.25 | ⚠️ Needs Improvement | -10 points |
| > 0.25 | ❌ Poor | -25 points |
| Missing/Null | ❌ Missing | -15 points |

**Example**:
- CLS = 0.05 → **0 points deducted** (Good)
- CLS = 0.15 → **-10 points deducted** (Needs Improvement)
- CLS = 0.5 → **-25 points deducted** (Poor)
- CLS = null → **-15 points deducted** (Missing)

---

### 4. FCP (First Contentful Paint) - **10 Points Maximum**

**Weight**: 10% of total score

| FCP Value | Status | Points Deducted |
|-----------|--------|-----------------|
| ≤ 1.8 seconds | ✅ Good | 0 points |
| 1.8 - 3.0 seconds | ⚠️ Needs Improvement | -5 points |
| > 3.0 seconds | ❌ Poor | -10 points |
| Missing/Null | ❌ Missing | -7 points |

**Example**:
- FCP = 0.6s → **0 points deducted** (Good)
- FCP = 2.5s → **-5 points deducted** (Needs Improvement)
- FCP = 4.5s → **-10 points deducted** (Poor)
- FCP = null → **-7 points deducted** (Missing)

---

### 5. TTI (Time to Interactive) - **10 Points Maximum**

**Weight**: 10% of total score

| TTI Value | Status | Points Deducted |
|-----------|--------|-----------------|
| ≤ 3.8 seconds | ✅ Good | 0 points |
| 3.8 - 7.3 seconds | ⚠️ Needs Improvement | -5 points |
| > 7.3 seconds | ❌ Poor | -10 points |
| Missing/Null | ❌ Missing | -7 points |

**Example**:
- TTI = 2.5s → **0 points deducted** (Good)
- TTI = 5.0s → **-5 points deducted** (Needs Improvement)
- TTI = 10.0s → **-10 points deducted** (Poor)
- TTI = null → **-7 points deducted** (Missing)

---

### 6. TBT (Total Blocking Time) - **5 Points Maximum**

**Weight**: 5% of total score

| TBT Value | Status | Points Deducted |
|-----------|--------|-----------------|
| ≤ 200ms | ✅ Good | 0 points |
| 200 - 600ms | ⚠️ Needs Improvement | -2 points |
| > 600ms | ❌ Poor | -5 points |
| Missing/Null | ❌ Missing | -3 points |

**Example**:
- TBT = 100ms → **0 points deducted** (Good)
- TBT = 400ms → **-2 points deducted** (Needs Improvement)
- TBT = 800ms → **-5 points deducted** (Poor)
- TBT = null → **-3 points deducted** (Missing)

---

## 📊 Complete Example Calculation

### Scenario 1: Good Performance

**Metrics**:
- LCP: 2.0s (Good) → **-0 points**
- FID: null (Not Applicable) → **-0 points**
- CLS: 0.05 (Good) → **-0 points**
- FCP: 1.2s (Good) → **-0 points**
- TTI: 3.0s (Good) → **-0 points**
- TBT: 150ms (Good) → **-0 points**

**Calculation**:
```
Score = 100 - (0 + 0 + 0 + 0 + 0 + 0) = 100
```

**Result**: **100 points** ✅

---

### Scenario 2: Average Performance

**Metrics**:
- LCP: 3.5s (Needs Improvement) → **-10 points**
- FID: null (Not Applicable) → **-0 points**
- CLS: 0.15 (Needs Improvement) → **-10 points**
- FCP: 2.5s (Needs Improvement) → **-5 points**
- TTI: 5.0s (Needs Improvement) → **-5 points**
- TBT: 400ms (Needs Improvement) → **-2 points**

**Calculation**:
```
Score = 100 - (10 + 0 + 10 + 5 + 5 + 2) = 100 - 32 = 68
```

**Result**: **68 points** ⚠️

---

### Scenario 3: Poor Performance

**Metrics**:
- LCP: 6.1s (Poor) → **-25 points**
- FID: null (Not Applicable) → **-0 points**
- CLS: 0.3 (Poor) → **-25 points**
- FCP: 4.5s (Poor) → **-10 points**
- TTI: 10.0s (Poor) → **-10 points**
- TBT: 800ms (Poor) → **-5 points**

**Calculation**:
```
Score = 100 - (25 + 0 + 25 + 10 + 10 + 5) = 100 - 75 = 25
```

**Result**: **25 points** ❌

---

### Scenario 4: Missing Metrics (Your Current Issue)

**Metrics**:
- LCP: null (Missing) → **-15 points**
- FID: null (Not Applicable) → **-0 points**
- CLS: 0 (Good) → **-0 points**
- FCP: null (Missing) → **-7 points**
- TTI: null (Missing) → **-7 points**
- TBT: 0 (Good) → **-0 points**

**Calculation**:
```
Score = 100 - (15 + 0 + 0 + 7 + 7 + 0) = 100 - 29 = 71
```

**Result**: **71 points** (NOT 100!)

**But if FCP, TTI are showing wrong values (like 7256ms treated as 7.256s), then:**
- FCP: 7.256s (Poor) → **-10 points**
- TTI: negative (filtered out) → **-7 points**

**Calculation**:
```
Score = 100 - (15 + 0 + 0 + 10 + 7 + 0) = 100 - 32 = 68
```

---

## 🔍 Why You're Seeing Score 100

### Problem 1: Missing Metrics Not Penalized (FIXED)

**Before Fix**:
- If LCP is null → No penalty (bug!)
- If FCP is null → No penalty (bug!)
- If TTI is null → No penalty (bug!)
- Result: Score stays at 100 even with missing data

**After Fix**:
- Missing LCP → **-15 points**
- Missing FCP → **-7 points**
- Missing TTI → **-7 points**
- Result: Score properly penalized for missing data

---

### Problem 2: Wrong Metric Values (FIXED)

**Before Fix**:
- FCP showing 7256ms but treated as 7.256s (should be 0.6s)
- TTI showing negative huge numbers (calculation error)
- LCP timing slightly off

**After Fix**:
- Better timing collection
- LCP stability check (waits for LCP to stabilize)
- Improved timing reference points

---

## 🎯 Score Ranges Interpretation

| Score Range | Performance Level | Description |
|-------------|-------------------|-------------|
| 90-100 | ✅ Excellent | All metrics are good |
| 75-89 | ⚠️ Good | Most metrics are good, some need improvement |
| 50-74 | ⚠️ Needs Improvement | Several metrics need optimization |
| 0-49 | ❌ Poor | Most metrics are poor, significant optimization needed |

---

## 🔧 Debugging Score Calculation

When running in development mode, the score calculation logs detailed breakdown:

```
📊 Score Calculation Breakdown:
   Starting Score: 100
   LCP: 6.1 (poor) → -25 points
   FID: null (not-applicable) → -0 points
   CLS: 0 (good) → -0 points
   FCP: 7.256 (poor) → -10 points
   TTI: null (missing) → -7 points
   TBT: 0 (good) → -0 points
   Final Score: 58
```

This helps you understand exactly how the score was calculated.

---

## 📝 Key Takeaways

1. **Score starts at 100** and deducts points for poor performance
2. **LCP, FID, CLS are most important** (25 points each = 75% of score)
3. **Missing metrics are penalized** (except FID which requires user interaction)
4. **Score ranges from 0-100** (0 = worst, 100 = best)
5. **All deductions are logged** in development mode for debugging

---

## ⚠️ Important Notes

- **FID null is acceptable** - No penalty because it requires user interaction
- **Missing other metrics is penalized** - Assumes poor performance
- **Score calculation is deterministic** - Same metrics = same score
- **Timing issues can affect accuracy** - Fixed timing collection improves consistency

