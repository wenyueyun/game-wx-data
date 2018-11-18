// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class Launch extends cc.Component {

    @property(cc.Node)
    content: cc.Node = null;

    @property(cc.Prefab)
    prefab: cc.Prefab = null;

    @property(cc.SpriteAtlas)
    atlas:cc.SpriteAtlas = null;

    private selfData: any = null;

    start() {
        wx.onMessage(data => {
            console.log(data);
            switch (data.type) {
                case "getSelfData":
                    this.getUserCloudStorage();
                    break;
                case "updateSelfData":
                    this.updateSelfData(data.key, data.value);
                    break;
                case "rank":
                    this.getFriendCloudStorage();
                    break;
            }
        });
    }

    //获取好友数据
    private getFriendCloudStorage(): void {
        this.content.removeAllChildren();
        cc.log("获取好友信息");
        // https://developers.weixin.qq.com/minigame/dev/document/open-api/data/wx.getFriendCloudStorage.html
        wx.getFriendCloudStorage({
            keyList: ['level'],
            success: (res) => {
                console.log(res);

                var users = [];

                for (let index = 0; index < res.data.length; index++) {
                    let element = res.data[index];
                    var userInfo: any = {};
                    userInfo.nickname = element.nickname;
                    userInfo.avatarUrl = element.avatarUrl;
                    if (element.KVDataList) {
                        for (let index = 0; index < element.KVDataList.length; index++) {
                            const kv = element.KVDataList[index];
                            if (kv.key == "level") {
                                userInfo.level = kv.value;
                                break;
                            }
                        }
                    }
                    users.push(userInfo);
                }

                //排序
                users.sort((a, b) => b.level - a.level);

                for (let index = 0; index < users.length; index++) {
                    this.showUserData(users[index],index+1);
                    this.showUserData(users[index],index+1);
                    this.showUserData(users[index],index+1);
                }
                
                users = null;
            },
            fail: function (res) {
                console.error(res);
            }
        });
    }

    //显示好友排行榜
    private showUserData(userInfo: any,rank:number) {

        let avatarUrl = userInfo.avatarUrl;
        let nickname = userInfo.nickname;
        let level = userInfo.level;

        let node = cc.instantiate(this.prefab);
        node.parent = this.content;
        let userName = node.getChildByName('userName').getComponent(cc.Label);
        let userData = node.getChildByName('userData').getComponent(cc.Label);
        let userIcon = node.getChildByName('mask').children[0].getComponent(cc.Sprite);
        let userRank = node.getChildByName("userRank").getComponent(cc.Sprite);

        userName.string = nickname;
        userData.string = level;

        if(rank <= 3)
        {
            userRank.spriteFrame = this.atlas.getSpriteFrame("num_"+rank);
            userRank.node.active = true;
        }
        else
        {
            userRank.node.active = false;
        }

        cc.loader.load({
            url: avatarUrl, type: 'png'
        }, (err, texture) => {
            if (err) console.error(err);
            userIcon.spriteFrame = new cc.SpriteFrame(texture);
        });
    }


    //获取用户数据
    public getUserCloudStorage(): void {
        cc.log("获取数据");
        let data: any =
        {
            keyList: ['level'],
            success: (res: any) => {
                this.selfData = res.KVDataList;
                cc.log("获取数据成功");
                console.log(res);

                this.updateSelfData("level", Math.round(Math.random() * 1000).toString());
            },
        }
        wx.getUserCloudStorage(data);
    }


    //更新数据
    private updateSelfData(curKey: string, curValue: string) {
        cc.log("更新玩家数据  key:" + curKey + "    value:" + curValue);

        let isNew = true;
        if (this.selfData != null && this.selfData.length > 0) {
            for (let index = 0; index < this.selfData.length; index++) {
                const element = this.selfData[index];
                if (element.key == curKey) {
                    if (element.value < curValue) {
                        this.setUserCloudStorage(curKey, curValue);
                    }
                    isNew = false;
                    break;
                }
            }
        }

        if (isNew) {
            cc.log("玩家没有保存当前类型数据，直接添加");
            this.setUserCloudStorage(curKey, curValue);
        }
    }

    //保存用户数据
    public setUserCloudStorage(curKey: string, curValue: string): void {
        cc.log("保存用户数据" + curKey + "    -   " + curValue);
        let data: any =
        {
            KVDataList: [{ key: curKey, value: curValue }],

            success: (res: any) => {
                cc.log("保存成功");
                console.log(res);
            },
            fail: (res: any) => {
                console.log(res);
            }
        }
        wx.setUserCloudStorage(data);
    }
}
