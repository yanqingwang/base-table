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
        await page.goto('https://www.csdn.net')
        print('已打开CSDN，等待登录完成...')
        
        try:
            await page.wait_for_selector('.user-info, .username, [class*="login"]', timeout=60000)
        except:
            print('等待登录超时，继续尝试...')
        
        await page.wait_for_timeout(3000)
        await page.goto('https://i.csdn.net/my')
        await page.wait_for_timeout(3000)
        
        await page.screenshot(path='/home/wang/wk/code/csdn_my.png')
        
        content = await page.content()
        print(f'页面标题: {await page.title()}')
        
        user_info = await page.evaluate('''() => {
            const info = {};
            
            const selectors = [
                '.name .username', '.user-info .name', 'span.username',
                '[class*="user-name"]', '[class*="nickname"]'
            ];
            
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el && el.textContent.trim()) {
                    info.username = el.textContent.trim();
                    break;
                }
            }
            
            const bodyText = document.body.innerText;
            const loginRegex = /登录|login|sign in/i;
            info.isLoggedIn = !loginRegex.test(bodyText.substring(0, 500));
            
            return info;
        }''')
        
        print(f'页面调试信息: {user_info}')
        
        if not user_info.get('username'):
            print('未检测到用户名，可能未登录或选择器不匹配')
            print('保存页面快照用于调试...')
            with open('/home/wang/wk/code/csdn_page.html', 'w', encoding='utf-8') as f:
                f.write(await page.content())
        
        print(f'用户信息: {user_info}')
        await page.screenshot(path='/home/wang/wk/code/csdn_profile.png')
        print('已保存截图到 csdn_profile.png')
        
        await browser.close()


if __name__ == '__main__':
    asyncio.run(main())
