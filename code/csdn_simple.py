import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            executable_path='/usr/bin/chromium',
            args=['--no-sandbox']
        )
        page = await browser.new_page()
        
        print('1. 打开CSDN首页...')
        await page.goto('https://www.csdn.net')
        await page.wait_for_timeout(3000)
        
        print('2. 检查页面元素...')
        title = await page.title()
        print(f'   页面标题: {title}')
        
        print('3. 尝试点击登录/用户按钮...')
        try:
            login_btn = await page.query_selector('text=登录')
            if login_btn:
                print('   发现登录按钮，点击登录...')
                await login_btn.click()
                await page.wait_for_timeout(2000)
                print('   等待登录（60秒）...')
                await page.wait_for_timeout(60000)
        except Exception as e:
            print(f'   操作异常: {e}')
        
        print('4. 尝试访问个人中心...')
        await page.goto('https://me.csdn.net/')
        await page.wait_for_timeout(3000)
        
        print('5. 提取页面信息...')
        info = await page.evaluate('''() => {
            return {
                title: document.title,
                url: window.location.href,
                bodyText: document.body.innerText.substring(0, 500)
            };
        }''')
        print(f'   标题: {info["title"]}')
        print(f'   URL: {info["url"]}')
        print(f'   内容预览: {info["bodyText"][:200]}...')
        
        await page.screenshot(path='/home/wang/wk/code/csdn_final.png')
        print('   截图已保存到 csdn_final.png')
        
        print('\n浏览器保持打开，按Ctrl+C退出')
        await asyncio.sleep(300)

if __name__ == '__main__':
    asyncio.run(main())
