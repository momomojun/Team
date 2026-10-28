"""VROOM 当裁判（scripts/referee-lib.mjs 建好问题，这里只负责交给 VROOM 解）。

用法：python scripts/vroom-referee.py problems.json solutions.json
要先装 VROOM 的 Python 包：python -m pip install pyvroom

problems.json：[{id, matrix（分钟）, vehicles: [{id, start, end, window: [from, to]}], jobs: [{id, location, service, windows, allowed}]}]
solutions.json：{id: {routes: {车的 id: [景点的 id, ...]}, unassigned: [景点的 id, ...]}}
时间都是分钟：第 d 天的 8 点是 d * 1440 + 480。“只能放在哪几天”用 VROOM 的 skills 表示：每个景点一个技能，能去的那几天的车才有
"""

import json
import sys

import numpy
import vroom
from vroom import _vroom

# “出发”任务的 id 从这里往上（景点的 id 是矩阵里的下标，不会这么大）
DEPART_BASE = 1_000_000


def solve(problem):
    inst = vroom.Input()
    # 自己先建好矩阵：pyvroom 按 dtype="uint32" 转，Windows 上 numpy 2 的 uint32 和它的 C++ 那边格式对不上
    # （报 Incompatible buffer format），"I"（unsigned int）在各平台都是 32 位、对得上
    matrix = _vroom.Matrix(numpy.asarray(problem["matrix"], dtype="I"))
    inst.set_durations_matrix(profile="car", matrix_input=matrix)
    skills_of = {vehicle["id"]: set() for vehicle in problem["vehicles"]}
    for job in problem["jobs"]:
        for vehicle_id in job["allowed"]:
            skills_of[vehicle_id].add(job["id"])
    # 每天都得出门：没用上的车 VROOM 算 0，可换住处的那天人还是要从前一晚住处开到当晚住处。
    # 每辆车在自己的出发点放一个停留 0 分钟、只有它能接的“出发”任务，车就一定会用上，这段路才算进去
    for vehicle in problem["vehicles"]:
        depart = DEPART_BASE + vehicle["id"]
        skills_of[vehicle["id"]].add(depart)
        inst.add_job(vroom.Job(depart, location=vehicle["start"], skills={depart}, priority=100))
    for vehicle in problem["vehicles"]:
        inst.add_vehicle(
            vroom.Vehicle(
                vehicle["id"],
                start=vehicle["start"],
                end=vehicle["end"],
                time_window=vroom.TimeWindow(*vehicle["window"]),
                skills=skills_of[vehicle["id"]],
            )
        )
    for job in problem["jobs"]:
        inst.add_job(
            vroom.Job(
                job["id"],
                location=job["location"],
                default_service=job["service"],
                time_windows=[vroom.TimeWindow(a, b) for a, b in job["windows"]],
                skills={job["id"]},
                # 都要排：VROOM 先保证排上的景点多，再比车程
                priority=100,
            )
        )
    solution = inst.solve(exploration_level=5, nb_threads=4)
    routes = {}
    frame = solution.routes
    for row in frame[frame["type"] == "job"].itertuples():
        if int(row.id) < DEPART_BASE:
            routes.setdefault(int(row.vehicle_id), []).append(int(row.id))
    assigned = {job for jobs in routes.values() for job in jobs}
    return {"routes": routes, "unassigned": [job["id"] for job in problem["jobs"] if job["id"] not in assigned]}


def main():
    problems = json.load(open(sys.argv[1], encoding="utf-8"))
    solutions = {problem["id"]: solve(problem) for problem in problems}
    json.dump(solutions, open(sys.argv[2], "w", encoding="utf-8"))


if __name__ == "__main__":
    main()
