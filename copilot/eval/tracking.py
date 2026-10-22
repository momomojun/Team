"""评测结果记到 MLflow（计划书写的“MLflow 记实验”，10-22 做的）。

设了 COPILOT_MLFLOW=1 才记（没装 mlflow 就不记、不报错）；记在本机 copilot/mlruns/ 里的 SQLite（mlflow.db）和附件目录
（MLFLOW_TRACKING_URI 可以换，不提交；MLflow 3 不再支持纯文件的存法），
不要账号。每次评测一条 run：参数是哪组样例、哪个模型、回放还是真模型、各步提示词版本；指标是通过数、比例、耗时；
报告 JSON 当附件。看的时候：

    mlflow ui --backend-store-uri sqlite:///copilot/mlruns/mlflow.db

打开 http://127.0.0.1:5000 ，同一个实验（单句 / 多轮对话 / 读公告）里勾几条 run 就能比。
"""
from __future__ import annotations

import os
from pathlib import Path

HERE = Path(__file__).resolve().parent
STORE = HERE.parent / "mlruns"


def enabled() -> bool:
    if os.environ.get("COPILOT_MLFLOW") != "1":
        return False
    try:
        import mlflow  # noqa: F401
    except ImportError:
        print("（设了 COPILOT_MLFLOW=1，但没装 mlflow：pip install \"copilot[experiments]\"，这次不记）")
        return False
    return True


def log(experiment: str, run_name: str, params: dict, metrics: dict, report: Path | None = None, tags: dict | None = None) -> None:
    """记一条 run；数字以外的指标不记（MLflow 只收数字）"""
    if not enabled():
        return
    try:
        _log(experiment, run_name, params, metrics, report, tags)
    except Exception as error:  # 记不上（库版本、文件被占用）不影响评测本身和门禁
        print(f"（MLflow 没记上：{error}）")


def _log(experiment, run_name, params, metrics, report, tags) -> None:
    import mlflow

    STORE.mkdir(parents=True, exist_ok=True)
    mlflow.set_tracking_uri(os.environ.get("MLFLOW_TRACKING_URI", f"sqlite:///{(STORE / 'mlflow.db').as_posix()}"))
    if mlflow.get_experiment_by_name(experiment) is None:
        mlflow.create_experiment(experiment, artifact_location=(STORE / "artifacts").as_uri())
    mlflow.set_experiment(experiment)
    with mlflow.start_run(run_name=run_name):
        mlflow.log_params({key: str(value)[:500] for key, value in params.items() if value is not None})
        mlflow.log_metrics({key: float(value) for key, value in metrics.items() if isinstance(value, (int, float)) and not isinstance(value, bool)})
        if tags:
            mlflow.set_tags(tags)
        if report and report.exists():
            mlflow.log_artifact(str(report))
    print(f"已记到 MLflow：实验「{experiment}」，run「{run_name}」")


def prompt_params(hashes: dict) -> dict:
    """各步提示词的版本（hash 太长，记版本号和前 8 位）"""
    out = {}
    # prompt_hashes() 是 {"intake/v1": "79d3b5f861f0", ...}
    for key, value in (hashes or {}).items():
        step, _, version = key.partition("/")
        out[f"prompt_{step}"] = f"{version} {str(value)[:8]}".strip()
    return out
