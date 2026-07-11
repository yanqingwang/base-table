# Global


Learning Task，测试交付，限制条件等具有全局性。

开发系统开发的功能都在dev文件夹中，生成环境的功能，全部位于prd文件夹中。

如果有任何问题，请先澄清需求。

# DEV

## Prepare

登录网站[https://apps-d.docusign.com/send/documents](https://apps-d.docusign.com/send/documents)，用户名： [ross.wang@te.com](mailto:ross.wang@te.com) 密码：[请联系 IT 部门获取] 账号有绑定多个子账号，请为了不同的子账户45444181，45445035 分别开发，确保功能可应用。暂时任务主要聚焦在45444181。



## Action Task

1. 使用API，批量发送offer。主要在
2. 解决offer使用API触发时，总有部分变量不能完全填写
3. 解决可以通过手机号发送签署信封的任务。
4. 部分offer批量发起后，员工不能继续更新数据。
相关测试数据位于DEV文件夹中，Sample-Bulk-Recipient.xlsx
    

## 测试和交付

- 所有信封发送出去之前，校验数据完整性，所有变量都已经正确填充；
- 校验变量数据成功的出现在了pdf正确的位置上。
- 发送给候选人的信件，他们需要可以在线编辑，包括补充和更新之前预先填写的个人档案信息等。
- 只有所有测试完成后才可以停止，否则一直执行上述学习、发现、开发和测试的过程。
- 所有都正确执行后，书写操作手册文件。
    

## 输出
1. 输出技能1，指定模板名字和数据模板，可以批量发起offer
2. 生成目标模板名字为 MY_Offer_Laird_Bulk_Send-DEV2. 如果有，则直接覆盖。
## 限制条件

- 如果还有问题，则不断修复错误，直到没有错误。
- 邮箱用 wangyantsing@qq.com
- 如果数据有问题，直接销毁信封，不要浪费时间。

# PRD

## Prepare

登录网站[https://apps.docusign.com/send/documents](https://apps.docusign.com/send/documents)，请为了不同的子账户694285719开发，确保功能可应用。
所有内容位于PRD文件夹中。

## Action Task

### 参考学习

1. 可以参考学习，包括通过chrome dev tool的前台操作等，但是不要真正发送任。
2. 模板主要是 MY_Offer_Laird_Bulk_Send(1)
    

## Stop Action

- 所有涉及到的邮箱都使用 wangyantsing@qq.com
- 不要真实发送信封出去。
- 不做任何新建和修改配置的功能