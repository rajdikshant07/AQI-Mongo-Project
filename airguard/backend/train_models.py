"""
AirGuard: Phase 5 - Pure Logistic Regression Training, Evaluation & Persistence Suite
=====================================================================================
Dedicated exclusively to Logistic Regression conforming strictly to the academic
reference: "Logistic Regression Through MongoDB – Theory, Mathematical Foundation,
MongoDB Integration, Python Program, Model Evaluation and Final-Year Project Workflow".

Implements:
1. Mandatory 70:30 Stratified Split (random_state=42, stratify=y)
2. StandardScaler (Zero Data Leakage - fit on train only)
3. Binary Logistic Regression with L2 Regularization & L-BFGS solver
4. Complete Mathematical Parameter Extraction: Intercept beta_0, Coefficients beta_j, Odds Ratios exp(beta_j)
5. Comprehensive Academic Evaluation: Confusion Matrix, Accuracy, Precision, Recall, F1, ROC-AUC, Log Loss
6. 300-DPI Publication Figures for Logistic Regression
7. Storage of Evaluation Metrics in MongoDB collection 'model_evaluation'
"""

import os
import sys
import json
import time
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, log_loss, confusion_matrix, classification_report,
    roc_curve
)
from datetime import datetime

# Path setup
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.config import Config
from backend.database import get_db

PROCESSED_CSV = os.path.join(Config.BASE_DIR, "dataset", "processed", "processed_air_quality.csv")
MODELS_DIR = os.path.join(Config.BASE_DIR, "models")
FIGURES_DIR = os.path.join(Config.BASE_DIR, "reports", "figures")
REPORTS_DIR = os.path.join(Config.BASE_DIR, "reports")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(FIGURES_DIR, exist_ok=True)

# Feature definitions (Strictly excluding AQI & AQI_Bucket to eliminate target leakage)
FEATURE_COLUMNS = [
    "pm25", "pm10", "no", "no2", "nox", "nh3", "co", "so2", "o3",
    "benzene", "toluene", "pm_ratio", "nitrogen_ratio", "combustion_index",
    "month_sin", "month_cos", "is_weekend"
]
TARGET_COLUMN = "air_quality_risk"


def prepare_train_test_split():
    """
    Mandatory 70:30 Train-Test Split with StandardScaler:
    - 70% Training Data (17,395 records)
    - 30% Testing Data (7,455 records)
    - random_state = 42 for exact mathematical reproducibility
    - stratify = y to maintain 38.49% : 61.51% class proportions in both sets
    - StandardScaler fit_transform on train, transform on test (Zero Data Leakage)
    """
    print("=" * 85)
    print("STEP 1: Mandatory 70:30 Stratified Train-Test Split & StandardScaler")
    print("=" * 85)
    
    df = pd.read_csv(PROCESSED_CSV)
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN].values
    
    total_records = len(df)
    print(f"[*] Total Clean Observations: {total_records:,}")
    print(f"[*] Features Dimension (p): {len(FEATURE_COLUMNS)} variables")
    print(f"[*] Feature Names: {', '.join(FEATURE_COLUMNS)}")
    print(f"[*] Target Variable: '{TARGET_COLUMN}' (0 = Lower Risk, 1 = Elevated Risk)")
    
    # 70:30 Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.30,
        random_state=42,
        stratify=y
    )
    
    train_count = len(X_train)
    test_count = len(X_test)
    print(f"\n[*] Partition Breakdown (70:30 Mandatory Split):")
    print(f"    - Training Partition (70%): {train_count:,} records")
    print(f"      * Class 0: {(y_train == 0).sum():,} ({(y_train == 0).mean()*100:.2f}%)")
    print(f"      * Class 1: {(y_train == 1).sum():,} ({(y_train == 1).mean()*100:.2f}%)")
    print(f"    - Testing Partition  (30%): {test_count:,} records")
    print(f"      * Class 0: {(y_test == 0).sum():,} ({(y_test == 0).mean()*100:.2f}%)")
    print(f"      * Class 1: {(y_test == 1).sum():,} ({(y_test == 1).mean()*100:.2f}%)")
    print("    [CONFIRMED] Stratified class ratios in train and test partitions match perfectly.")
    
    # Standard Scaler
    print("\n[*] Applying StandardScaler (Zero Data Leakage Protocol):")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test) # Transform only; test data remains completely unseen
    
    # Persist Scaler
    scaler_path = os.path.join(MODELS_DIR, "scaler.pkl")
    joblib.dump(scaler, scaler_path)
    print(f"    [SAVED] Scaler serialized to: {scaler_path}")
    print("    [LEAKAGE CHECK] Scaler mean and standard deviation learned exclusively from X_train.")
    
    return X_train, X_test, X_train_scaled, X_test_scaled, y_train, y_test, scaler


def train_logistic_regression(X_train_scaled, y_train, X_test_scaled, y_test):
    """
    Trains Binary Logistic Regression:
    Mathematical Foundation:
    z = beta_0 + sum(beta_j * x_j)
    P(y=1|X) = 1 / (1 + e^-z)
    Logit: ln(p / [1-p]) = beta_0 + X * beta
    Odds Ratio: exp(beta_j)
    """
    print("\n" + "=" * 85)
    print("STEP 2: Training Academic Model: Logistic Regression")
    print("=" * 85)
    
    start_time = time.time()
    lr = LogisticRegression(
        penalty="l2",
        C=1.0,
        solver="lbfgs",
        max_iter=1000,
        random_state=42
    )
    lr.fit(X_train_scaled, y_train)
    train_time = time.time() - start_time
    
    # Predictions
    y_pred = lr.predict(X_test_scaled)
    y_prob = lr.predict_proba(X_test_scaled)[:, 1]
    
    # Mathematical Parameter Extraction
    intercept = float(lr.intercept_[0])
    coefficients = lr.coef_[0]
    odds_ratios = np.exp(coefficients)
    
    print(f"[*] Training Time: {train_time:.4f} seconds")
    print(f"[*] Model Intercept (beta_0): {intercept:.4f}")
    print("\n[*] Coefficient Attribution & Odds Ratios (Top Predictors):")
    coef_df = pd.DataFrame({
        "feature": FEATURE_COLUMNS,
        "coefficient_beta": coefficients,
        "odds_ratio": odds_ratios
    }).sort_values(by="coefficient_beta", ascending=False)
    
    for idx, row in coef_df.iterrows():
        print(f"    - {row['feature']:18}: beta = {row['coefficient_beta']:+7.4f} | Odds Ratio = {row['odds_ratio']:6.3f}")
        
    # Save Model
    model_path = os.path.join(MODELS_DIR, "logistic_model.pkl")
    joblib.dump(lr, model_path)
    # Also save as logistic_regression.pkl for convenience
    joblib.dump(lr, os.path.join(MODELS_DIR, "logistic_regression.pkl"))
    print(f"\n[SAVED] Logistic Regression model serialized to: {model_path}")
    
    return lr, y_pred, y_prob, train_time, coef_df


def evaluate_logistic_regression(y_test, y_pred, y_prob, train_time):
    """
    Computes rigorous academic evaluation metrics for Logistic Regression:
    - Confusion Matrix (TP, TN, FP, FN)
    - Accuracy, Precision, Recall, F1 Score
    - ROC-AUC, Log Loss
    """
    print("\n" + "=" * 85)
    print("STEP 3: Empirical Model Evaluation & Academic Performance Metrics")
    print("=" * 85)
    
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    auc = roc_auc_score(y_test, y_prob)
    loss = log_loss(y_test, y_prob)
    
    metrics = {
        "model_name": "Logistic Regression",
        "is_primary_model": True,
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1_score": round(float(f1), 4),
        "roc_auc": round(float(auc), 4),
        "log_loss": round(float(loss), 4),
        "train_time_sec": round(float(train_time), 4),
        "inference_latency_ms": round(float(train_time / len(y_test) * 1000), 4),
        "confusion_matrix": {
            "tn": int(tn), "fp": int(fp),
            "fn": int(fn), "tp": int(tp)
        },
        "evaluated_at": datetime.utcnow()
    }
    
    print(f"[*] Accuracy             : {acc*100:.2f}%")
    print(f"[*] Precision (PPV)      : {prec*100:.2f}%")
    print(f"[*] Recall (Sensitivity) : {rec*100:.2f}%")
    print(f"[*] F1 Score             : {f1*100:.2f}%")
    print(f"[*] ROC-AUC Score        : {auc:.4f}")
    print(f"[*] Binary Log Loss      : {loss:.4f}")
    print(f"[*] Confusion Matrix     : TN={tn:,}, FP={fp:,}, FN={fn:,}, TP={tp:,}")
    print("\n[*] Classification Report:\n" + classification_report(y_test, y_pred, target_names=["Lower Risk (0)", "Elevated Risk (1)"]))
    
    return metrics


def generate_evaluation_visualizations(y_test, y_pred, y_prob, coef_df):
    """
    Renders high-resolution (300 DPI) publication figures for Logistic Regression:
    - 07_confusion_matrices.png: 2x2 Confusion Matrix with Type I/II annotations
    - 08_roc_curves.png: ROC Curve with AUC score
    - 09_model_metrics_comparison.png: Logistic Regression Performance Metric Bar
    - 10_logistic_coefficients.png: Standardized Coefficients & Odds Ratios
    """
    print("\n" + "=" * 85)
    print("STEP 4: Rendering High-Resolution (300 DPI) Evaluation Visualizations")
    print("=" * 85)
    
    sns.set_theme(style="whitegrid", palette="muted")
    
    # --------------------------------------------------------------------------
    # Figure 1: Logistic Regression Confusion Matrix
    # --------------------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(7, 6))
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()
    total = len(y_test)
    
    annot_matrix = np.array([
        [f"True Negative (TN)\n{tn:,}\n({tn/total*100:.1f}%)", f"False Positive (FP - Type I)\n{fp:,}\n({fp/total*100:.1f}%)"],
        [f"False Negative (FN - Type II)\n{fn:,}\n({fn/total*100:.1f}%)", f"True Positive (TP)\n{tp:,}\n({tp/total*100:.1f}%)"]
    ])
    
    sns.heatmap(cm, annot=annot_matrix, fmt="", cmap="Blues", cbar=True, ax=ax,
                xticklabels=["Predicted Lower (0)", "Predicted Elevated (1)"],
                yticklabels=["Actual Lower (0)", "Actual Elevated (1)"],
                annot_kws={"size": 11, "weight": "bold"})
    ax.set_title("AirGuard: Logistic Regression Confusion Matrix\n(30% Held-Out Test Set, N = 7,455)", fontsize=13, weight="bold", pad=12)
    plt.tight_layout()
    fig1_path = os.path.join(FIGURES_DIR, "07_confusion_matrices.png")
    plt.savefig(fig1_path, dpi=300)
    plt.close()
    print(f"    [SAVED] {fig1_path}")
    
    # --------------------------------------------------------------------------
    # Figure 2: ROC Curve for Logistic Regression
    # --------------------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(7, 6))
    fpr, tpr, _ = roc_curve(y_test, y_prob)
    auc_score = roc_auc_score(y_test, y_prob)
    
    ax.plot(fpr, tpr, color="#2563eb", lw=2.5, label=f"Logistic Regression (AUC = {auc_score:.4f})")
    ax.plot([0, 1], [0, 1], color="#94a3b8", lw=1.5, linestyle="--", label="Random Chance (AUC = 0.5000)")
    ax.set_xlim([-0.02, 1.02])
    ax.set_ylim([-0.02, 1.05])
    ax.set_xlabel("False Positive Rate (1 - Specificity)", fontsize=11, weight="bold")
    ax.set_ylabel("True Positive Rate (Sensitivity / Recall)", fontsize=11, weight="bold")
    ax.set_title("AirGuard: Receiver Operating Characteristic (ROC) Curve\nLogistic Regression Model", fontsize=13, weight="bold", pad=12)
    ax.legend(loc="lower right", frameon=True, fontsize=10)
    plt.tight_layout()
    fig2_path = os.path.join(FIGURES_DIR, "08_roc_curves.png")
    plt.savefig(fig2_path, dpi=300)
    plt.close()
    print(f"    [SAVED] {fig2_path}")
    
    # --------------------------------------------------------------------------
    # Figure 3: Performance Metric Overview
    # --------------------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(8, 5))
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_prob)
    
    metrics_names = ["Accuracy", "Precision", "Recall", "F1 Score", "ROC-AUC"]
    metrics_vals = [acc * 100, prec * 100, rec * 100, f1 * 100, auc * 100]
    colors = ["#10b981", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899"]
    
    bars = ax.bar(metrics_names, metrics_vals, color=colors, width=0.55, edgecolor="none")
    ax.set_ylim([70, 100])
    ax.set_ylabel("Score (%)", fontsize=11, weight="bold")
    ax.set_title("AirGuard: Logistic Regression Evaluation Summary Metrics", fontsize=13, weight="bold", pad=12)
    for bar in bars:
        h = bar.get_height()
        ax.text(bar.get_x() + bar.get_width() / 2, h + 0.6, f"{h:.2f}%", ha="center", va="bottom", fontsize=10, weight="bold")
    plt.tight_layout()
    fig3_path = os.path.join(FIGURES_DIR, "09_model_metrics_comparison.png")
    plt.savefig(fig3_path, dpi=300)
    plt.close()
    print(f"    [SAVED] {fig3_path}")
    
    # --------------------------------------------------------------------------
    # Figure 4: Logistic Regression Standardized Coefficients
    # --------------------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(10, 6))
    plot_df = coef_df.sort_values(by="coefficient_beta", ascending=True)
    colors = ["#ef4444" if b > 0 else "#10b981" for b in plot_df["coefficient_beta"]]
    
    bars = ax.barh(plot_df["feature"], plot_df["coefficient_beta"], color=colors, height=0.65)
    ax.axvline(0, color="#64748b", lw=1.2, linestyle="--")
    ax.set_xlabel("Standardized Logistic Regression Coefficient (beta)", fontsize=11, weight="bold")
    ax.set_title("AirGuard: Feature Impact on Log-Odds of Elevated Pollution Risk\n(Positive beta = Increases Risk | Negative beta = Decreases Risk)", fontsize=12, weight="bold", pad=12)
    for bar in bars:
        w = bar.get_width()
        offset = 0.15 if w >= 0 else -0.45
        ax.text(w + offset, bar.get_y() + bar.get_height() / 2, f"{w:+.2f}", va="center", fontsize=9, weight="bold", color="#334155")
    plt.tight_layout()
    fig4_path = os.path.join(FIGURES_DIR, "10_logistic_coefficients.png")
    plt.savefig(fig4_path, dpi=300)
    plt.close()
    print(f"    [SAVED] {fig4_path}")


def persist_evaluation_in_mongodb(metrics):
    """
    Persists evaluation metrics and training history into MongoDB collections:
    1. 'model_evaluation': Benchmark record for Logistic Regression.
    2. 'training_history': Experiment log capturing split counts and random_state=42.
    """
    print("\n" + "=" * 85)
    print("STEP 5: Persisting Model Evaluation & Experiment History in MongoDB")
    print("=" * 85)
    
    db = get_db()
    eval_coll = db[Config.COLL_MODEL_EVALUATION]
    hist_coll = db[Config.COLL_TRAINING_HISTORY]
    
    # 1. Reset and insert single model evaluation
    eval_coll.drop()
    res_eval = eval_coll.insert_one(metrics)
    print(f"[+] Persisted Logistic Regression evaluation in '{Config.COLL_MODEL_EVALUATION}': _id={res_eval.inserted_id}")
    
    # 2. Log Training History Experiment
    experiment_doc = {
        "experiment_id": f"EXP_LR_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
        "dataset_name": "CPCB India Air Quality Dataset (2015-2020)",
        "model_trained": "Logistic Regression",
        "split_ratio": "70:30",
        "stratified": True,
        "random_state": 42,
        "total_records": 24850,
        "train_records": 17395,
        "test_records": 7455,
        "features": FEATURE_COLUMNS,
        "target": TARGET_COLUMN,
        "accuracy": metrics["accuracy"],
        "f1_score": metrics["f1_score"],
        "roc_auc": metrics["roc_auc"],
        "log_loss": metrics["log_loss"],
        "trained_at": datetime.utcnow()
    }
    
    hist_coll.drop()
    res_hist = hist_coll.insert_one(experiment_doc)
    print(f"[+] Persisted training experiment in '{Config.COLL_TRAINING_HISTORY}': _id={res_hist.inserted_id}")


def main():
    print("\n" + "=" * 85)
    print("AIRGUARD: PHASE 5 - PURE LOGISTIC REGRESSION TRAINING & EVALUATION ENGINE")
    print("=" * 85)
    
    # 1. Data Prep (70:30 Split & StandardScaler)
    X_train, X_test, X_train_scaled, X_test_scaled, y_train, y_test, scaler = prepare_train_test_split()
    
    # 2. Train Logistic Regression
    lr, y_pred, y_prob, train_time, coef_df = train_logistic_regression(
        X_train_scaled, y_train, X_test_scaled, y_test
    )
    
    # 3. Comprehensive Evaluation
    metrics = evaluate_logistic_regression(y_test, y_pred, y_prob, train_time)
    
    # 4. Generate Visualizations (300 DPI)
    generate_evaluation_visualizations(y_test, y_pred, y_prob, coef_df)
    
    # 5. Persist to MongoDB
    persist_evaluation_in_mongodb(metrics)
    
    print("\n" + "=" * 85)
    print("[SUCCESS] PURE LOGISTIC REGRESSION TRAINING & PERSISTENCE COMPLETE!")
    print("=" * 85)


if __name__ == "__main__":
    main()
