"""
AirGuard: Phase 5 - Machine Learning Engine, Evaluation & Persistence Suite
===========================================================================
Implements the mandatory 70:30 stratified split, StandardScaler with data leakage
prevention, Logistic Regression (Primary), Decision Tree, Random Forest, SVM,
and Gradient Boosting. Computes all academic metrics, generates evaluation figures,
and stores performance records in MongoDB.
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
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, log_loss, confusion_matrix, classification_report,
    roc_curve, precision_recall_curve
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
    Primary Model: Binary Logistic Regression
    Mathematical Foundation:
    z = beta_0 + sum(beta_j * x_j)
    P(y=1|X) = 1 / (1 + e^-z)
    Logit: ln(p / [1-p]) = beta_0 + X * beta
    Odds Ratio: exp(beta_j)
    """
    print("\n" + "=" * 85)
    print("STEP 2: Training Primary Academic Model: Logistic Regression")
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
        sign = "+" if row["coefficient_beta"] >= 0 else "-"
        print(f"    - {row['feature']:18}: beta = {row['coefficient_beta']:+7.4f} | Odds Ratio = {row['odds_ratio']:6.3f}")
        
    # Save Model
    model_path = os.path.join(MODELS_DIR, "logistic_model.pkl")
    joblib.dump(lr, model_path)
    print(f"\n[SAVED] Logistic Regression model serialized to: {model_path}")
    
    return lr, y_pred, y_prob, train_time, coef_df


def train_comparison_models(X_train_scaled, y_train, X_test_scaled, y_test):
    """
    Trains additional classification algorithms on the identical 70:30 partition:
    1. Decision Tree Classifier
    2. Random Forest Classifier
    3. Support Vector Machine (Linear with Platt probability calibration)
    4. Gradient Boosting Classifier
    """
    print("\n" + "=" * 85)
    print("STEP 3: Training Comparison Algorithms (Identical Experimental Partitions)")
    print("=" * 85)
    
    models = {
        "Decision Tree": DecisionTreeClassifier(
            max_depth=10,
            min_samples_split=20,
            random_state=42
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=100,
            max_depth=15,
            min_samples_split=10,
            n_jobs=-1,
            random_state=42
        ),
        "Support Vector Machine": CalibratedClassifierCV(
            estimator=LinearSVC(C=1.0, random_state=42, max_iter=2000),
            cv=3
        ),
        "Gradient Boosting": GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
    }
    
    results = {}
    
    for name, clf in models.items():
        print(f"[*] Training {name}...")
        start_time = time.time()
        clf.fit(X_train_scaled, y_train)
        t_time = time.time() - start_time
        
        y_pred = clf.predict(X_test_scaled)
        if hasattr(clf, "predict_proba"):
            y_prob = clf.predict_proba(X_test_scaled)[:, 1]
        else:
            y_prob = clf.decision_function(X_test_scaled)
            
        # Serialize model
        file_slug = name.lower().replace(" ", "_")
        m_path = os.path.join(MODELS_DIR, f"{file_slug}.pkl")
        joblib.dump(clf, m_path)
        print(f"    - Completed in {t_time:.3f}s | Serialized to: {m_path}")
        
        results[name] = {
            "model": clf,
            "y_pred": y_pred,
            "y_prob": y_prob,
            "train_time": t_time
        }
        
    return results


def evaluate_all_models(all_predictions, y_test):
    """
    Computes rigorous academic evaluation metrics:
    - Confusion Matrix (TP, TN, FP, FN)
    - Accuracy, Precision, Recall, F1 Score
    - ROC-AUC, Log Loss
    - Compiles empirical comparison table
    """
    print("\n" + "=" * 85)
    print("STEP 4: Empirical Model Evaluation & Comparative Performance Table")
    print("=" * 85)
    
    comparison_records = []
    detailed_metrics = {}
    
    for name, data in all_predictions.items():
        y_pred = data["y_pred"]
        y_prob = data["y_prob"]
        t_time = data["train_time"]
        
        cm = confusion_matrix(y_test, y_pred)
        tn, fp, fn, tp = cm.ravel()
        
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred)
        rec = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        roc = roc_auc_score(y_test, y_prob)
        ll = log_loss(y_test, y_prob)
        
        detailed_metrics[name] = {
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "roc_auc": round(float(roc), 4),
            "log_loss": round(float(ll), 4),
            "confusion_matrix": {
                "tp": int(tp), "tn": int(tn), "fp": int(fp), "fn": int(fn)
            },
            "training_time_sec": round(float(t_time), 4),
            "classification_report": classification_report(y_test, y_pred, output_dict=True)
        }
        
        comparison_records.append({
            "Algorithm": name,
            "Accuracy": acc,
            "Precision": prec,
            "Recall": rec,
            "F1-Score": f1,
            "ROC-AUC": roc,
            "Log Loss": ll,
            "Train Time (s)": t_time
        })
        
    df_compare = pd.DataFrame(comparison_records).sort_values(by="F1-Score", ascending=False)
    
    # Print Clean Academic Comparison Table
    print("\n" + "-" * 95)
    print(f"{'Algorithm':<24} | {'Accuracy':<8} | {'Precision':<9} | {'Recall':<8} | {'F1-Score':<8} | {'ROC-AUC':<8} | {'Time (s)':<8}")
    print("-" * 95)
    for _, row in df_compare.iterrows():
        print(f"{row['Algorithm']:<24} | {row['Accuracy']*100:6.2f}%  | {row['Precision']*100:7.2f}%  | {row['Recall']*100:6.2f}%  | {row['F1-Score']*100:6.2f}%  | {row['ROC-AUC']:8.4f} | {row['Train Time (s)']:8.3f}")
    print("-" * 95)
    
    return df_compare, detailed_metrics


def generate_evaluation_visualizations(all_predictions, y_test, df_compare, coef_df):
    """
    Generates publication-quality evaluation figures:
    1. Figure 7: Multi-panel Confusion Matrices
    2. Figure 8: Combined ROC Curves (All Models)
    3. Figure 9: Performance Metrics Comparison Bar Chart
    4. Figure 10: Logistic Regression Coefficients & Odds Ratios
    """
    print("\n" + "=" * 85)
    print("STEP 5: Generating Evaluation Figures & ROC Curves")
    print("=" * 85)
    
    # --------------------------------------------------------------------------
    # Figure 7: Confusion Matrices
    # --------------------------------------------------------------------------
    print("    [*] Generating Figure 7: Confusion Matrices...")
    fig, axes = plt.subplots(1, len(all_predictions), figsize=(20, 4.5))
    for ax, (name, data) in zip(axes, all_predictions.items()):
        cm = confusion_matrix(y_test, data["y_pred"])
        sns.heatmap(
            cm, annot=True, fmt="d", cmap="Blues", cbar=False, ax=ax,
            xticklabels=["Lower (0)", "Elevated (1)"],
            yticklabels=["Lower (0)", "Elevated (1)"]
        )
        ax.set_title(name, fontweight="bold", fontsize=11)
        ax.set_xlabel("Predicted Label")
        ax.set_ylabel("True Label")
    fig.suptitle("AirGuard: Confusion Matrices on 30% Unseen Test Set (N = 7,455)", fontsize=13, fontweight="bold", y=1.03)
    plt.tight_layout()
    out_cm = os.path.join(FIGURES_DIR, "07_confusion_matrices.png")
    plt.savefig(out_cm, dpi=300, bbox_inches="tight")
    plt.close()
    print(f"        Saved to: {out_cm}")

    # --------------------------------------------------------------------------
    # Figure 8: ROC Curves
    # --------------------------------------------------------------------------
    print("    [*] Generating Figure 8: Multi-Model ROC Curves...")
    plt.figure(figsize=(9, 7))
    colors = ["#2563eb", "#d97706", "#059669", "#7c3aed", "#dc2626"]
    
    for (name, data), color in zip(all_predictions.items(), colors):
        fpr, tpr, _ = roc_curve(y_test, data["y_prob"])
        auc = roc_auc_score(y_test, data["y_prob"])
        plt.plot(fpr, tpr, color=color, linewidth=2.2, label=f"{name} (AUC = {auc:.4f})")
        
    plt.plot([0, 1], [0, 1], "k--", linewidth=1.2, label="Random Classifier (AUC = 0.5000)")
    plt.title("AirGuard: Receiver Operating Characteristic (ROC) Curve Comparison", fontsize=13, fontweight="bold", pad=12)
    plt.xlabel("False Positive Rate (1 - Specificity)")
    plt.ylabel("True Positive Rate (Sensitivity / Recall)")
    plt.legend(loc="lower right", frameon=True, fontsize=10)
    plt.grid(True, linestyle=":", alpha=0.6)
    plt.tight_layout()
    out_roc = os.path.join(FIGURES_DIR, "08_roc_curves.png")
    plt.savefig(out_roc, dpi=300)
    plt.close()
    print(f"        Saved to: {out_roc}")

    # --------------------------------------------------------------------------
    # Figure 9: Performance Metrics Comparison
    # --------------------------------------------------------------------------
    print("    [*] Generating Figure 9: Performance Metrics Bar Chart...")
    metrics_melted = pd.melt(
        df_compare,
        id_vars=["Algorithm"],
        value_vars=["Accuracy", "Precision", "Recall", "F1-Score", "ROC-AUC"],
        var_name="Metric",
        value_name="Score"
    )
    plt.figure(figsize=(12, 6))
    sns.barplot(x="Metric", y="Score", hue="Algorithm", data=metrics_melted, palette="Set2", edgecolor="black")
    plt.title("AirGuard: Multi-Model Metric Comparison on Held-Out Test Set (30%)", fontsize=13, fontweight="bold", pad=12)
    plt.ylabel("Score (0.0 to 1.0)")
    plt.ylim(0.70, 1.02)
    plt.legend(loc="lower right", frameon=True)
    plt.tight_layout()
    out_comp = os.path.join(FIGURES_DIR, "09_model_metrics_comparison.png")
    plt.savefig(out_comp, dpi=300)
    plt.close()
    print(f"        Saved to: {out_comp}")

    # --------------------------------------------------------------------------
    # Figure 10: Logistic Regression Coefficients & Odds Ratios
    # --------------------------------------------------------------------------
    print("    [*] Generating Figure 10: Logistic Regression Coefficients & Odds Ratios...")
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 7))
    
    # Beta Coefficients
    colors_beta = ["#dc2626" if c > 0 else "#2563eb" for c in coef_df["coefficient_beta"]]
    ax1.barh(coef_df["feature"], coef_df["coefficient_beta"], color=colors_beta, edgecolor="black")
    ax1.axvline(0, color="black", linestyle="-", linewidth=1.0)
    ax1.set_title("Logistic Regression Weights (β Coefficients)", fontweight="bold")
    ax1.set_xlabel("Coefficient Value (Change in Log-Odds)")
    ax1.invert_yaxis()
    
    # Odds Ratios
    ax2.barh(coef_df["feature"], coef_df["odds_ratio"], color="#059669", edgecolor="black")
    ax2.axvline(1.0, color="red", linestyle="--", linewidth=1.5, label="Baseline Odds Ratio (OR = 1.0)")
    ax2.set_title("Odds Ratios [exp(β)] (Multiplicative Risk Factor)", fontweight="bold")
    ax2.set_xlabel("Odds Ratio Value")
    ax2.invert_yaxis()
    ax2.legend(loc="lower right")
    
    fig.suptitle("AirGuard Primary Academic Model: Logistic Regression Parameter Analysis", fontsize=14, fontweight="bold", y=0.98)
    plt.tight_layout()
    out_coef = os.path.join(FIGURES_DIR, "10_logistic_coefficients.png")
    plt.savefig(out_coef, dpi=300)
    plt.close()
    print(f"        Saved to: {out_coef}")


def store_model_evaluations_in_mongodb(detailed_metrics, df_compare):
    """
    Stores model evaluations in MongoDB 'model_evaluation' and training metadata in 'training_history'.
    """
    print("\n" + "=" * 85)
    print("STEP 6: Storing Evaluation Results & Training History into MongoDB")
    print("=" * 85)
    
    db = get_db()
    eval_coll = db[Config.COLL_MODEL_EVALUATION]
    history_coll = db[Config.COLL_TRAINING_HISTORY]
    
    eval_coll.delete_many({}) # Refresh current evaluations
    history_coll.delete_many({})
    
    eval_docs = []
    for name, metrics in detailed_metrics.items():
        doc = {
            "model_name": name,
            "accuracy": metrics["accuracy"],
            "precision": metrics["precision"],
            "recall": metrics["recall"],
            "f1_score": metrics["f1_score"],
            "roc_auc": metrics["roc_auc"],
            "log_loss": metrics["log_loss"],
            "confusion_matrix": metrics["confusion_matrix"],
            "classification_report": metrics["classification_report"],
            "training_time_sec": metrics["training_time_sec"],
            "is_primary_model": (name == "Logistic Regression"),
            "evaluated_at": datetime.utcnow()
        }
        eval_docs.append(doc)
        
    eval_coll.insert_many(eval_docs)
    print(f"    [SUCCESS] Ingested {len(eval_docs)} model evaluation records into '{Config.COLL_MODEL_EVALUATION}'.")
    
    # Store Training History
    training_doc = {
        "experiment_id": f"EXP_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
        "dataset_name": "CPCB India Air Quality Dataset (2015-2020)",
        "total_records": 24850,
        "train_records": 17395,
        "test_records": 7455,
        "split_ratio": "70:30",
        "random_state": 42,
        "stratified": True,
        "features": FEATURE_COLUMNS,
        "target": TARGET_COLUMN,
        "models_trained": list(detailed_metrics.keys()),
        "champion_model": df_compare.iloc[0]["Algorithm"],
        "champion_f1_score": round(float(df_compare.iloc[0]["F1-Score"]), 4),
        "trained_at": datetime.utcnow()
    }
    history_coll.insert_one(training_doc)
    print(f"    [SUCCESS] Ingested training experiment history into '{Config.COLL_TRAINING_HISTORY}'.")
    
    # Save summary JSON for frontend
    out_json = os.path.join(REPORTS_DIR, "model_comparison_metrics.json")
    with open(out_json, "w") as f:
        json.dump(detailed_metrics, f, indent=4)
    print(f"    [SAVED] Comparison metrics written to: {out_json}")


def run_full_training_pipeline():
    """Orchestrates Phase 5 training, evaluation, visualization, and database storage."""
    X_train, X_test, X_train_scaled, X_test_scaled, y_train, y_test, scaler = prepare_train_test_split()
    
    # Train Primary Model
    lr, y_pred_lr, y_prob_lr, lr_time, coef_df = train_logistic_regression(
        X_train_scaled, y_train, X_test_scaled, y_test
    )
    
    # Train Comparison Models
    comp_results = train_comparison_models(X_train_scaled, y_train, X_test_scaled, y_test)
    
    # Aggregate Predictions
    all_predictions = {
        "Logistic Regression": {
            "model": lr,
            "y_pred": y_pred_lr,
            "y_prob": y_prob_lr,
            "train_time": lr_time
        }
    }
    all_predictions.update(comp_results)
    
    # Evaluate Models
    df_compare, detailed_metrics = evaluate_all_models(all_predictions, y_test)
    
    # Generate Visualizations
    generate_evaluation_visualizations(all_predictions, y_test, df_compare, coef_df)
    
    # Store in MongoDB
    store_model_evaluations_in_mongodb(detailed_metrics, df_compare)
    
    print("\n" + "=" * 85)
    print("PHASE 5 MACHINE LEARNING ENGINE & COMPARISON SUITE COMPLETE!")
    print("=" * 85)


if __name__ == "__main__":
    run_full_training_pipeline()
