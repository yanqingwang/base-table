#!/usr/bin/env python3
"""
上海贝壳二手房数据采集器
使用系统默认 Chromium profile 访问，规避验证码
"""

import csv, os, re, sys, time, random
from datetime import datetime
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

CHROMIUM_PATH = "/usr/bin/chromium"
USER_DATA_DIR = os.path.expanduser("~/.config/chromium")
OUTPUT_CSV = str(Path.home() / "上海贝壳二手房.csv")
BASE = "https://sh.ke.com/ershoufang/"

log = lambda m: print(f"[{datetime.now().strftime('%H:%M:%S')}] {m}", flush=True)
wait = lambda: time.sleep(random.uniform(1.5, 3.0))


def parse(li):
    h = {}
    a = li.select_one(".title a")
    h["标题"] = a.get_text(strip=True) if a else ""
    h["链接"] = a.get("href","") if a else ""

    com = li.select_one(".communityName a,.communityName")
    h["小区"] = com.get_text(strip=True) if com else ""

    ar = li.select_one(".areaName .info,.areaName")
    h["区域"] = ar.get_text(strip=True) if ar else ""

    hi = li.select_one(".houseInfo")
    if hi:
        pts = [p.strip() for p in hi.get_text("|",strip=True).split("|")]
        for i,k in enumerate(["户型","面积","朝向","装修","楼层","年代"]):
            h[k] = pts[i] if i < len(pts) else ""
    else:
        for k in ["户型","面积","朝向","装修","楼层","年代"]: h[k] = ""

    fi = li.select_one(".followInfo")
    if fi:
        pts = fi.get_text(strip=True).split("/")
        h["关注人数"] = pts[0].strip() if len(pts)>0 else ""
        h["发布时间"] = pts[1].strip() if len(pts)>1 else ""
    else:
        h["关注人数"] = h["发布时间"] = ""

    tags = li.select(".tag span")
    h["标签"] = "、".join(t.get_text(strip=True) for t in tags)

    tp = li.select_one(".totalPrice span")
    h["总价(万元)"] = tp.get_text(strip=True) if tp else ""

    up = li.select_one(".unitPrice span")
    if up:
        m = re.search(r'[\d,]+', up.get_text(strip=True))
        h["单价(元/平)"] = m.group().replace(",","") if m else up.get_text(strip=True)
    else:
        h["单价(元/平)"] = ""

    h["房源编号"] = li.get("data-lj_action_ershoufang_id","")
    return h


def main():
    print("=" * 55)
    print("  上海贝壳二手房数据采集器")
    print("  (使用默认 Chromium profile)")
    print("=" * 55)

    all_data = []
    page_n = 1
    total_pages = None

    with sync_playwright() as p:
        log("🚀 启动浏览器（你的默认 Chromium profile）...")
        ctx = p.chromium.launch_persistent_context(
            user_data_dir=USER_DATA_DIR,
            headless=False,
            executable_path=CHROMIUM_PATH,
            args=["--no-sandbox"],
            viewport={"width": 1920, "height": 1080},
        )
        pages = ctx.pages
        page = pages[0] if pages else ctx.new_page()

        while True:
            url = BASE if page_n == 1 else f"{BASE}pg{page_n}/"
            log(f"📄 [{page_n}/{total_pages or '?'}] {url}")

            for _ in range(3):
                try:
                    page.goto(url, wait_until="domcontentloaded", timeout=30000)
                    time.sleep(2)
                    break
                except Exception as e:
                    log(f"  ⚠️ 重试: {str(e)[:50]}")
                    time.sleep(2)
            else:
                log(f"  ❌ 跳过第{page_n}页"); page_n += 1; continue

            # 验证码处理
            if "captcha" in page.url.lower():
                log("⚠️ 遇到验证码，请在浏览器中手动完成")
                print("\n" + "!" * 55)
                print("  浏览器已打开并显示验证码页面")
                print("  请手动完成滑块/点选验证")
                print("  验证通过后脚本自动继续")
                print("!" * 55 + "\n")
                start = time.time()
                while time.time() - start < 600:
                    time.sleep(2)
                    if "captcha" not in page.url.lower():
                        log("✅ 验证通过！")
                        time.sleep(1)
                        break
                    e = int(time.time() - start)
                    if e % 30 == 0:
                        print(f"  等待验证中... ({e}s)")
                else:
                    log("❌ 验证超时"); break
                continue

            # 解析
            html = page.content()
            soup = BeautifulSoup(html, "lxml")

            hlist = soup.select_one(".sellListContent")
            if not hlist:
                for ul in soup.find_all("ul"):
                    if sum(1 for li in ul.find_all("li",recursive=False) if li.select_one(".totalPrice")) > 3:
                        hlist = ul; break

            if not hlist:
                log("  ⚠️ 未找到房源列表"); page_n += 1; wait(); continue

            items = [li for li in hlist.find_all("li",recursive=False) if li.select_one(".totalPrice")] \
                    or [li for li in hlist.find_all("li") if li.select_one(".totalPrice")]

            page_data = []
            for li in items:
                try:
                    info = parse(li)
                    if info["标题"]: page_data.append(info)
                except: pass

            all_data.extend(page_data)
            log(f"  ✅ 本页{len(page_data)}条，累计{len(all_data)}条")

            # 总页数
            if total_pages is None:
                pb = page.query_selector(".page-box")
                if pb:
                    tp = pb.get_attribute("data-total-page")
                    if tp and tp.isdigit(): total_pages = int(tp)
                if not total_pages:
                    m = re.search(r'data-total-page[=:]\s*"?(\d+)', html)
                    if m: total_pages = int(m.group(1))
                if not total_pages:
                    m = re.search(r'共\s*(\d+)\s*页', soup.get_text())
                    if m: total_pages = int(m.group(1))
                if total_pages: log(f"  📊 共{total_pages}页")

            if total_pages and page_n >= total_pages:
                log("🏁 到最后一页"); break

            nxt = page.query_selector("a:has-text('下一页'):not(.disabled)")
            if not nxt or "disabled" in (nxt.get_attribute("class") or ""):
                log("🏁 无下一页"); break
            page_n += 1; wait()

        ctx.close()

    # 保存
    if all_data:
        fields = ["标题","小区","区域","户型","面积","朝向","装修","楼层","年代",
                   "总价(万元)","单价(元/平)","关注人数","发布时间","标签","房源编号","链接"]
        with open(OUTPUT_CSV, "w", newline="", encoding="utf-8-sig") as f:
            w = csv.DictWriter(f, fieldnames=fields)
            w.writeheader()
            for d in all_data:
                w.writerow({k: d.get(k,"") for k in fields})
        log(f"💾 保存: {OUTPUT_CSV} ({len(all_data)}条)")
        print(f"\n🎉 完成！共{len(all_data)}条 → {OUTPUT_CSV}")
    else:
        print("\n⚠️ 未采集到数据")


if __name__ == "__main__":
    main()
