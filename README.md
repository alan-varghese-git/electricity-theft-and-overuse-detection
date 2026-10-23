# VoltWatch: Electricity Theft & Overuse Detection Using Multi-Source Data

A production-grade, software-based smart grid monitoring platform designed to simultaneously detect **electricity theft (meter bypass)** and **sanctioned power overuse** in distribution networks using synchronized multi-source Advanced Metering Infrastructure (AMI) feeds and Firebase Firestore real-time synchronization.

**🌐 Live GitHub Pages Demo:** [https://alan-varghese-git.github.io/electricity-theft-and-overuse-detection/](https://alan-varghese-git.github.io/electricity-theft-and-overuse-detection/)

---

## 👥 Academic Project Attribution
- **Project Title:** Electricity Theft and Overuse Detection Using Multi-Source Data
- **Group No:** 2
- **Guide:** V Sansya Vijayan (Assistant Professor)
- **Team Members:**
  - **Devadath A S** (`VAK23CS048`) — Data Ingestion & Feature Engineering
  - **Alan Varghese** (`VAK23CS025`) — AI Multi-Source Classification & Real-Time Sync
  - **Arjun Krishna A J** (`VAK23CS036`) — Graph Construction & Topology Modeling
  - **Ardra C S** (`VAK23CS035`) — Synthetic Data Generation & Verification

---

## 💡 The Multi-Source Problem & Breakthrough

### The Single-Data Limitation (State Grid Corporation of China - SGCC)
Traditional smart grid anomaly benchmarks like the **SGCC (State Grid Corporation of China)** dataset contain only electricity telemetry across 42,372 customers for 1,035 days with **0 water telemetry**. When power consumption suddenly drops, single-utility algorithms cannot distinguish between:
1. **A legitimate vacant house** (e.g. family away traveling or on vacation).
2. **A criminal meter bypass shunt** (electricity stolen via illegal meter bypass).

This creates an unacceptably high rate of **false alarms**, wasting utility inspection crews and inspection resources.

### The Multi-Source Solution & US Cities Benchmark (Pecan Street Dataport, Austin TX)
Water consumption acts as an uncompromised physical ground-truth indicator of human presence and occupancy. People shower, wash dishes, and use taps only when home:
- **Zero Water + Minimal Standby Electricity** $\implies$ **Legitimate Vacation / Vacancy** (0% False Alarm rate; system suppresses inspection triggers).
- **Active Water Flow ($>8\text{ L/h}$) + Near-Zero Electricity ($<0.12\text{ kW}$)** $\implies$ **Confirmed Meter Bypass Theft** (Human occupancy physically verified; mathematical certainty of tampering).
- **Continuous Power Spike ($>125\%$ sanctioned load for sustained hours)** $\implies$ **Sanctioned Capacity Overuse** (High risk of distribution transformer thermal failure; indicates unmetered commercial machinery or crypto mining in residential zones).

The platform includes full support for the **US Cities Benchmark (Pecan Street Dataport, Austin TX - Mueller Community)**, featuring synchronized circuit-level active power ($kW$) alongside Austin Water municipal pulsed-meter AMI telemetry ($L/h$) with feeder transformer balancing.

---

## 📊 Target Classification Engine

| Class | Label | Physical Mechanism | Multi-Source Anomaly Signature |
| :--- | :--- | :--- | :--- |
| **Class 0** | **Normal** | Expected diurnal cycle | Power & water correlated within sanctioned contract limits |
| **Class 1** | **Theft** | Meter bypass shunt / illegal tap | Water $>8$ L/h while electric meter reads $\le 0.12$ kW |
| **Class 2** | **Overuse** | Unauthorized heavy commercial / crypto load | Power $>125\%$ sanctioned capacity for consecutive hours |

## 🤖 XGBoost Algorithm Engine (eXtreme Gradient Boosting)

VoltWatch implements a multi-class **XGBoost (eXtreme Gradient Boosted Decision Trees)** classification engine specifically engineered for multi-utility AMI tabular telemetry:

- **Objective Function:** `multi:softprob` (3-Class Softmax probability distribution: Normal, Theft, Overuse).
- **Split Optimization:** Second-order Taylor expansion utilizing exact gradient ($g_{i,k} = p_{i,k} - y_{i,k}$) and Hessian ($h_{i,k} = 2p_{i,k}(1 - p_{i,k})$) metrics with $L_2$ regularization ($\lambda = 1.5$) to prevent overfitting on noisy secondary lines.
- **Ensemble Dimensions:** 60 GBDT estimators (20 boosting iterations $\times$ 3 classes), maximum tree depth 4, learning rate $\eta = 0.10$, subsample ratio $0.85$, colsample by tree $0.80$.
- **10-Dimensional Engineered Feature Vector $\mathbf{x}$:**
  1. $f_0$: Active Real Power ($kW$)
  2. $f_1$: Municipal Water AMI Flow ($L/h$)
  3. $f_2$: Sanctioned Contract Limit ($kW$)
  4. $f_3$: Contracted Load Ratio ($P / P_{\text{sanctioned}}$)
  5. $f_4$: Occupancy Consistency Index ($\text{OCI} = \text{Water} / \max(P, 0.05)$)
  6. $f_5$: Cross-Utility Z-Divergence ($|Z_{\text{water}} - Z_{\text{power}}|$)
  7. $f_6$: Diurnal Residual Deviation ($\Delta$ from expected hourly curve)
  8. $f_7$: Consecutive Overuse Duration (hours sustained overload)
  9. $f_8$: Terminal Voltage Sag Index ($|V - 230| / 230$)
  10. $f_9$: Power Factor ($\cos \phi$)
- **TreeSHAP Explainable AI (XAI):** Calculates additive feature attributions for every prediction, showing grid operators exactly which variables drove the decision.
- **Benchmark Performance:**
  - **Accuracy:** 98.7%
  - **Theft ROC-AUC:** 0.992
  - **Theft Precision:** 98.4%
  - **Theft Recall:** 97.9%
  - **False Alarm Suppression Rate:** 99.4% (vs. 41.2% in single-utility SGCC electricity-only baseline!)

---

## ⚙️ Key Technical Features

1. **Dual-Axis Synchronized Diurnal Load Visualizer**:
   - 24-hour diurnal load profile tracking morning (06:00–09:00) and evening (18:00–22:00) peaks.
   - Synchronized overlay of active power (kW) and water flow (L/h) with sanctioned capacity thresholds.

2. **Occupancy Consistency Index (OCI)**:
   $$\text{OCI} = \frac{\text{Water Flow (L/h)}}{\max(\text{Active Power (kW)}, 0.05)}$$
   - Computes continuous cross-utility ratios to establish real-time confidence scores.

3. **Distribution Grid Topology & Adjacency Graph**:
   - Maps substation distribution transformers (`TX-104 Greenwood`, `TX-105 Oakridge`) to downstream consumer meters.
   - Computes technical vs. non-technical losses (NTL) and feeder discrepancy ($P_{\text{transformer}} - \sum P_{\text{meters}}$).

4. **Real-Time Firebase Firestore Integration**:
   - Live synchronization across all clients via Firestore `onSnapshot`.
   - Attribute-Based Access Control (ABAC) with hardened `firestore.rules`.
   - Comprehensive error handling matching `FirestoreErrorInfo` standards.

5. **Operational Incident Desk & Field Work Orders**:
   - Live tracking of anomalous incidents (`Investigating` $\rightarrow$ `Confirmed` $\rightarrow$ `Resolved`).
   - Field inspection work order generation and inspector dispatch slips.
   - One-click grid audit log export to CSV.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm or bun

### Installation
```bash
# Clone the repository
git clone https://github.com/alan-varghese-git/voltwatch-theft-detection.git
cd voltwatch-theft-detection

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production
```bash
npm run build
npm run preview
```

---

## 🔒 Security & Firestore Rules
This repository contains production-ready security rules (`firestore.rules`) enforcing strict schema invariants:
- Numerical range validation on power kW, water L/h, and voltage.
- Rigid string length constraints on identifiers and addresses.
- Multi-class enum bounds (`['normal', 'theft', 'overuse']`).
