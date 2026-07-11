#!/usr/bin/env python3
"""
微信公众号发布工具 —— 官方 API 版本

支持：
  - 本地图片自动上传到微信图床
  - Markdown 转微信公众号 HTML
  - 创建/更新草稿
  - 直接发布
  - 封面图自动上传

使用方法：
  pip install requests python-dotenv
  cp .env.example .env  # 填入 WECHAT_APPID 和 WECHAT_APPSECRET

  python publish_wechat.py --file article.md              # 创建草稿
  python publish_wechat.py --file article.md --publish     # 创建并发布
  python publish_wechat.py --file article.md --update MEDIA_ID  # 更新草稿
  python publish_wechat.py --file article.md --dry-run     # 仅验证
"""

import argparse
import json
import os
import re
import sys
import time

import requests
from dotenv import load_dotenv

load_dotenv()

APPID = os.getenv("WECHAT_APPID")
APPSECRET = os.getenv("WECHAT_APPSECRET")
API_BASE = "https://api.weixin.qq.com"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

_token_cache = {"token": None, "expires_at": 0}


def get_access_token() -> str:
    if time.time() < _token_cache["expires_at"]:
        return _token_cache["token"]
    url = f"{API_BASE}/cgi-bin/token"
    params = {"grant_type": "client_credential", "appid": APPID, "secret": APPSECRET}
    resp = requests.get(url, params=params, timeout=10)
    data = resp.json()
    if data.get("errcode", 0) != 0:
        raise RuntimeError(f"获取 token 失败: {data.get('errmsg', '未知错误')}")
    _token_cache["token"] = data["access_token"]
    _token_cache["expires_at"] = time.time() + data["expires_in"] - 200
    return _token_cache["token"]


def upload_image_to_wechat(filepath: str) -> str:
    """上传本地图片到微信永久素材，返回 media_id"""
    token = get_access_token()
    url = f"{API_BASE}/cgi-bin/material/add_material?access_token={token}&type=image"
    with open(filepath, "rb") as f:
        files = {"media": (os.path.basename(filepath), f, self_detect_mime(filepath))}
        resp = requests.post(url, files=files, timeout=30)
    data = resp.json()
    if data.get("errcode", 0) != 0:
        raise RuntimeError(f"上传图片失败({filepath}): {data.get('errmsg', '未知错误')}")
    mid = data.get("media_id", "")
    print(f"  🖼️ 上传图片: {os.path.basename(filepath)} -> media_id={mid}")
    return mid


def upload_image_to_cdn(image_url_or_path: str, base_dir: str) -> str:
    """
    将图片上传到微信公众号图床。
    支持：本地路径（相对/绝对）、http/https 外链、file:// 协议
    返回可在正文中使用的微信 URL。
    """
    token = get_access_token()
    # 解析图片路径
    img_path = image_url_or_path
    if img_path.startswith("file://"):
        img_path = img_path[7:]
    if not img_path.startswith("/"):
        img_path = os.path.join(base_dir, img_path)
    img_path = os.path.normpath(img_path)

    if os.path.isfile(img_path):
        # 本地文件 -> 上传到微信图床
        url = f"{API_BASE}/cgi-bin/media/uploadimg?access_token={token}"
        with open(img_path, "rb") as f:
            files = {"media": (os.path.basename(img_path), f, self_detect_mime(img_path))}
            resp = requests.post(url, files=files, timeout=30)
        data = resp.json()
        if data.get("errcode", 0) == 0:
            wx_url = data.get("url", "")
            if wx_url:
                print(f"  🖼️ 本地图片上传: {os.path.basename(img_path)} -> 微信CDN")
                return wx_url
        print(f"  ⚠️ 本地图片上传失败: {data.get('errmsg', '')}, 保留原路径")
        return image_url_or_path
    else:
        # 已经是外链或路径无效
        if img_path.startswith("http"):
            resp = requests.post(
                f"{API_BASE}/cgi-bin/media/uploadimg?access_token={token}",
                json={"url": img_path},
                timeout=30,
            )
            data = resp.json()
            if data.get("errcode", 0) == 0 and data.get("url"):
                return data["url"]
        return image_url_or_path


def self_detect_mime(filepath: str) -> str:
    ext = os.path.splitext(filepath)[1].lower()
    return {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
    }.get(ext, "image/jpeg")


def resolve_image_path(img_ref: str, base_dir: str) -> str:
    """解析图片引用路径，支持标准 Markdown 和 Obsidian ![[...]] 语法。
    搜索顺序：文件同目录、子目录、常见附件目录。"""
    name = os.path.basename(img_ref)
    candidates = [
        os.path.join(base_dir, img_ref),
        os.path.join(base_dir, name),
        os.path.join(base_dir, "assets", name),
        os.path.join(base_dir, "images", name),
        os.path.join(base_dir, "attachments", name),
        os.path.join(base_dir, "img", name),
        os.path.join("/home/wang/wk", name),  # workspace 根目录（Obsidian 默认粘贴位置）
    ]
    for root, dirs, files in os.walk(base_dir):
        if name in files:
            candidates.append(os.path.join(root, name))
            break
    for c in candidates:
        norm = os.path.normpath(c)
        if os.path.isfile(norm):
            return norm
    return os.path.join(base_dir, name)


def md_to_wechat_html(md_content: str, base_dir: str = "") -> tuple:
    """
    将 Markdown 转换为微信公众号兼容的 HTML。
    支持标准 Markdown ![]() 和 Obsidian ![[ ]] 图片语法。
    返回 (html, uploaded_images_count)
    自动处理本地图片上传到微信图床。
    """
    lines = md_content.split("\n")
    html_parts = []
    in_list = False
    in_table = False
    table_html = ""
    uploaded = 0

    for line in lines:
        line = re.sub(r'\[citation:\d+\]', '', line)

        # 图片：支持 ![](path) 和 ![[path]] 两种语法
        img_match = re.match(r'!\[(.*?)\]\((.*?)\)', line)
        obsidian_match = re.match(r'!\[\[(.+?)\]\]', line)
        if img_match or obsidian_match:
            if img_match:
                alt = img_match.group(1)
                src = img_match.group(2).strip()
            else:
                alt = ""
                src = obsidian_match.group(1).strip()
            # 上传本地图片
            if src and not src.startswith("http") and not src.startswith("data:") and base_dir:
                resolved = resolve_image_path(src, base_dir)
                if os.path.isfile(resolved):
                    wx_url = upload_image_to_cdn(resolved, os.path.dirname(resolved))
                    if wx_url and wx_url != src:
                        uploaded += 1
                        src = wx_url
            html_parts.append(
                f'<p><img src="{src}" alt="{alt}" style="width:100%;border-radius:8px;" /></p>'
            )
            continue

        if line.startswith("## "):
            if in_list:
                html_parts.append("</ul>")
                in_list = False
            html_parts.append(f"<h2>{line[3:]}</h2>")
        elif line.startswith("### "):
            if in_list:
                html_parts.append("</ul>")
                in_list = False
            html_parts.append(f"<h3 style='font-size:18px;'>{line[4:]}</h3>")
        elif line.startswith("#### "):
            if in_list:
                html_parts.append("</ul>")
                in_list = False
            html_parts.append(f"<h4 style='font-size:16px;'>{line[5:]}</h4>")
        elif line.startswith("# "):
            continue

        elif "|" in line and line.startswith("|"):
            if not in_table:
                table_html = "<table style='width:100%;border-collapse:collapse;margin:15px 0;'>"
                in_table = True
            if re.match(r"^\|[\s\-:]+\|", line):
                continue
            cells = line.strip().strip("|").split("|")
            cells = [c.strip() for c in cells]
            table_html += "<tr>"
            for cell in cells:
                table_html += f"<td style='border:1px solid #ddd;padding:8px;'>{cell}</td>"
            table_html += "</tr>"
            continue
        elif in_table:
            table_html += "</table>"
            html_parts.append(table_html)
            in_table = False
            table_html = ""

        elif line.startswith("- ") or line.startswith("* "):
            item_text = line[2:]
            if not in_list:
                html_parts.append("<ul>")
                in_list = True
            html_parts.append(f"<li>{item_text}</li>")
        elif line.startswith("1. "):
            item_text = line[3:]
            if not in_list:
                html_parts.append("<ol>")
                in_list = True
            html_parts.append(f"<li>{item_text}</li>")

        elif line.startswith("> "):
            if in_list:
                html_parts.append("</ul>")
                in_list = False
            html_parts.append(
                f"<blockquote style='border-left:4px solid #07c160;padding:10px 15px;margin:15px 0;background:#f9f9f9;color:#666;'>{line[2:]}</blockquote>"
            )

        elif line.startswith("```"):
            if in_list:
                html_parts.append("</ul>")
                in_list = False
            continue

        elif line.strip() == "---":
            if in_list:
                html_parts.append("</ul>")
                in_list = False
            html_parts.append(
                "<hr style='border:none;border-top:1px solid #eee;margin:20px 0;' />"
            )

        elif line.strip() == "":
            if in_list:
                html_parts.append("</ul>")
                in_list = False

        else:
            if in_list:
                html_parts.append("</ul>")
                in_list = False
            text = line
            text = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", text)
            text = re.sub(r"\*(.*?)\*", r"<em>\1</em>", text)
            text = re.sub(
                r"\[(.*?)\]\((.*?)\)",
                r'<a href="\2" style="color:#07c160;">\1</a>',
                text,
            )
            if text.strip():
                html_parts.append(f"<p>{text}</p>")

    if in_list:
        html_parts.append("</ul>")
    if in_table:
        table_html += "</table>"
        html_parts.append(table_html)

    return "\n".join(html_parts), uploaded


def extract_first_image(content: str, base_dir: str) -> str:
    """从 Markdown 提取第一张图片的本地路径，支持 ![]() 和 ![[ ]]"""
    for line in content.split("\n"):
        m = re.match(r'!\[(.*?)\]\((.*?)\)', line)
        if m:
            src = m.group(2).strip()
            resolved = resolve_image_path(src, base_dir)
            if os.path.isfile(resolved):
                return resolved
        m = re.match(r'!\[\[(.+?)\]\]', line)
        if m:
            src = m.group(1).strip()
            resolved = resolve_image_path(src, base_dir)
            if os.path.isfile(resolved):
                return resolved
    return ""


def parse_markdown(filepath: str) -> dict:
    """解析 Markdown 文件，返回 title/digest/content"""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    title_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else os.path.splitext(os.path.basename(filepath))[0]

    after_title = re.sub(r"^#\s+.*$", "", content, count=1, flags=re.MULTILINE)
    after_title = re.sub(r"!\[\[.*?\]\]", "", after_title)
    after_title = re.sub(r"!\[.*?\]\(.*?\)", "", after_title)
    after_title = after_title.strip()
    digest_match = re.search(r"^(.{10,120}?)[。！？\n]", after_title, re.MULTILINE)
    digest = digest_match.group(1)[:120] if digest_match else ""

    base_dir = os.path.dirname(os.path.abspath(filepath))
    body_html, uploaded = md_to_wechat_html(content, base_dir)
    if uploaded:
        print(f"  📸 自动上传了 {uploaded} 张本地图片到微信图床")

    if len(body_html) > 20000:
        print(f"  ⚠️ 正文过长({len(body_html)}字符)，微信限制20000字符，请精简内容")
        body_html = body_html[:20000]

    # 提取第一张图片作为封面候选
    first_img = extract_first_image(content, base_dir)

    return {"title": title, "digest": digest, "content": body_html, "first_image": first_img}


def create_draft(article: dict, thumb_media_id: str = "") -> str:
    token = get_access_token()
    url = f"{API_BASE}/cgi-bin/draft/add?access_token={token}"

    article_body = {
        "title": article["title"],
        "author": "Ross",
        "digest": article["digest"],
        "content": article["content"],
        "content_source_url": "",
        "need_open_comment": 1,
        "only_fans_can_comment": 0,
    }
    if thumb_media_id:
        article_body["thumb_media_id"] = thumb_media_id

    payload = {"articles": [article_body]}
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    headers = {"Content-Type": "application/json; charset=utf-8"}
    resp = requests.post(url, data=body, headers=headers, timeout=30)
    data = resp.json()
    if data.get("errcode", 0) != 0:
        raise RuntimeError(f"新建草稿失败: errcode={data.get('errcode')} {data.get('errmsg', '未知错误')}")
    mid = data["media_id"]
    print(f"  ✅ 草稿创建成功! media_id: {mid}")
    return mid


def update_draft(article: dict, media_id: str, thumb_media_id: str = "") -> str:
    """更新已有草稿（需要先删除原草稿再新建）"""
    token = get_access_token()

    # 微信 API 不支持直接更新草稿，需要删除后重建
    del_url = f"{API_BASE}/cgi-bin/draft/delete?access_token={token}"
    del_resp = requests.post(del_url, json={"media_id": media_id}, timeout=15)
    del_data = del_resp.json()
    if del_data.get("errcode", 0) == 0:
        print(f"  🗑️ 删除旧草稿: {media_id}")
    else:
        print(f"  ⚠️ 删除草稿失败: {del_data.get('errmsg', '')}，将新建")

    # 重建
    return create_draft(article, thumb_media_id)


def upload_cover(cover_path: str) -> str:
    """上传封面图，返回 media_id"""
    if not os.path.exists(cover_path):
        print("  ⚠️ 未找到封面文件")
        return ""
    print("  🖼️ 上传封面图...")
    try:
        mid = upload_image_to_wechat(cover_path)
        return mid
    except Exception as e:
        print(f"  ⚠️ 封面上传失败: {e}")
        return ""


def main():
    parser = argparse.ArgumentParser(description="微信公众号发布工具")
    parser.add_argument("--file", required=True, help="文章 Markdown 文件路径")
    parser.add_argument("--update", default="", help="更新已有草稿的 media_id")
    parser.add_argument("--publish", action="store_true", help="直接发布")
    parser.add_argument("--dry-run", action="store_true", help="仅验证")
    args = parser.parse_args()

    if not APPID or not APPSECRET:
        print("❌ 请配置 .env 文件中的 WECHAT_APPID 和 WECHAT_APPSECRET")
        sys.exit(1)

    filepath = os.path.abspath(args.file)
    if not os.path.exists(filepath):
        print(f"❌ 文件不存在: {filepath}")
        sys.exit(1)

    print(f"📄 读取文章: {filepath}")
    article = parse_markdown(filepath)
    print(f"   标题: {article['title']}")
    print(f"   标题长度: {len(article['title'])} 字符 (微信限制64)")
    print(f"   摘要: {article['digest'][:50]}...")
    print(f"   正文长度: {len(article['content'])} 字符 (微信限制20000)")

    if len(article["title"]) > 64:
        print(f"  ❌ 标题超长 ({len(article['title'])} > 64)，请缩短")
        sys.exit(1)
    article["digest"] = article["digest"][:20]

    if args.dry_run:
        print("\n🔍 干运行 — 配置验证通过")
        print(f"   AppID: {APPID[:5]}...{APPID[-4:]}")
        token = get_access_token()
        print(f"   Token: {token[:10]}...")
        return

    # 上传封面：优先使用文章第一张图片，否则用默认封面
    cover_path = article.get("first_image", "")
    if not cover_path or not os.path.isfile(cover_path):
        cover_path = os.path.join(SCRIPT_DIR, "default_cover.jpg")
        print(f"  🖼️ 未找到文章首图，使用默认封面")
    thumb_id = upload_cover(cover_path)
    if thumb_id and article.get("first_image") and os.path.isfile(article["first_image"]):
        print(f"  🖼️ 文章首图已作为封面")

    # 创建或更新草稿
    if args.update:
        print(f"\n📝 更新草稿: {args.update}...")
        media_id = update_draft(article, args.update, thumb_id)
    else:
        print("\n📝 创建新草稿...")
        media_id = create_draft(article, thumb_id)

    # 发布
    if args.publish:
        print("\n🚀 发布中...")
        token = get_access_token()
        url = f"{API_BASE}/cgi-bin/freepublish/submit?access_token={token}"
        resp = requests.post(url, json={"media_id": media_id}, timeout=30)
        data = resp.json()
        if data.get("errcode", 0) != 0:
            print(f"  ❌ 发布失败: {data.get('errmsg', '')}")
        else:
            print(f"  ✅ 发布提交成功! publish_id: {data.get('publish_id', 'N/A')}")
    else:
        print("\n✅ 草稿已保存")
        print(f"   media_id: {media_id}")
        print("   如需发布: python publish_wechat.py --file <file> --update <media_id> --publish")


if __name__ == "__main__":
    main()
