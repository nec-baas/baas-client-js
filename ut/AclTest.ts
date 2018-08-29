import {Nebula, Acl} from "../build/baas";
import "mocha";
import {assert, expect} from "chai";

describe("Acl", () => {
    function addEntries(acl: Acl, permission: string, entries: string[], offset: number) {
        for (let i = offset; i < entries.length; i++) {
            acl.addEntry(permission, entries[i]);
        }
    }

    function removeAllEntries(acl: Acl, permission: string, entries: string[]) {
        for (let i = 0; i < entries.length; i++) {
            acl.removeEntry(permission, entries[i]);
        }
    }

    function hasEntry(acl: Acl, permission: string, entry: string) {
        const aclEntries = acl.getEntries(permission);
        if (aclEntries !== null) {
            for (let i = 0; i < aclEntries.length; i++) {
                if (aclEntries[i] === entry) {
                    return true;
                }
            }
        }

        return false;
    }

    function compareEntries(acl: Acl, permission: string, entries: string[]) {
        const aclEntries = acl.getEntries(permission);
        
        if (aclEntries.length !== entries.length) {
            return false;
        }

        for (let i = 0; i < aclEntries.length; i++) {
            let found = false;
            for (let j = 0; j < entries.length; j++) {
                if (aclEntries[i] === entries[j]) {
                    found = true;
                    break;
                }
            }

            if (!found) {
                return false;
            }
        }
        return true;
    }

    it("Nebula.Acl : 各定義値のアクセス(rwcud/admin)", () => {
        expect(Nebula.Acl.READ).equal("r", "Nebula.Acl.READ にアクセスできること");
        expect(Nebula.Acl.WRITE).equal("w", "Nebula.Acl.WRITE にアクセスできること");
        expect(Nebula.Acl.CREATE).equal("c", "Nebula.Acl.CREATE にアクセスできること");
        expect(Nebula.Acl.UPDATE).equal("u", "Nebula.Acl.UPDATE にアクセスできること");
        expect(Nebula.Acl.DELETE).equal("d", "Nebula.Acl.DELETE にアクセスできること");
        expect(Nebula.Acl.ADMIN).equal("admin", "Nebula.Acl.ADMIN にアクセスできること");
    });


    it("Nebula.Acl : 各定義値のアクセス(g:)", () => {
        expect(Nebula.Acl.AUTHENTICATED).equal("g:authenticated", "Nebula.Acl.AUTHENTICATED にアクセスできること");
        expect(Nebula.Acl.ANONYMOUS).equal("g:anonymous", "Nebula.Acl.ANONYMOUS にアクセスできること");

    });

    it("Nebula.Acl : 各メソッドの動作", () => {
        const acl = new Nebula.Acl();
        expect(acl).instanceof(Nebula.Acl, "Nebula.Acl インスタンスが生成できること");

        const keys = [Nebula.Acl.READ, Nebula.Acl.WRITE, Nebula.Acl.CREATE, Nebula.Acl.UPDATE, Nebula.Acl.DELETE, Nebula.Acl.ADMIN];

        for (const key of keys) {
            expect(acl.getEntries(key)).empty;
        }
        expect(acl.getOwner(), "インスタンス生成直後、OWNERが設定されていないこと").null;

        const readEntries = [
            "514f36644f9cb2eb8000001",
            "514f36644f9cb2eb8000002",
            "514f36644f9cb2eb8000003",
            "514f36644f9cb2eb8000004",
            "514f36644f9cb2eb8000005",
            "514f36644f9cb2eb8000006",
            "514f36644f9cb2eb8000007",
            "514f36644f9cb2eb8000008",
            "514f36644f9cb2eb8000009",
            "514f36644f9cb2eb8000010"
        ];
        const writeEntries = [
            "514f36644f9cb2eb8000011",
            "514f36644f9cb2eb8000012",
            "514f36644f9cb2eb8000013",
            "514f36644f9cb2eb8000014",
            "514f36644f9cb2eb8000015"
        ];
        const createEntries = [
            "514f36644f9cb2eb8000016",
            "514f36644f9cb2eb8000017",
            "514f36644f9cb2eb8000018"
        ];
        const updateEntries = [
            "514f36644f9cb2eb8000019",
            "514f36644f9cb2eb8000020"
        ];
        const deleteEntries = [
            "514f36644f9cb2eb8000021",
            "514f36644f9cb2eb8000022",
            "514f36644f9cb2eb8000023",
            "514f36644f9cb2eb8000024"
        ];
        const adminEntries = [
            "514f36644f9cb2eb8000025",
            "514f36644f9cb2eb8000026"
        ];
        const entriesSet = [
            {key: Nebula.Acl.READ, entries: readEntries},
            {key: Nebula.Acl.WRITE, entries: writeEntries},
            {key: Nebula.Acl.CREATE, entries: createEntries},
            {key: Nebula.Acl.UPDATE, entries: updateEntries},
            {key: Nebula.Acl.DELETE, entries: deleteEntries},
            {key: Nebula.Acl.ADMIN, entries: adminEntries},
        ];

        // 1件エントリ追加
        for (const e of entriesSet) {
            expect(acl.addEntry(e.key, e.entries[0])).true;
            expect(acl.getEntries(e.key)).have.lengthOf(1);
        }

        // 複数エントリ追加
        for (const e of entriesSet) {
            addEntries(acl, e.key, e.entries, 1);
            expect(acl.getEntries(e.key)).have.lengthOf(e.entries.length);
        }

        // エントリ内容検査
        for (const e of entriesSet) {
            expect(compareEntries(acl, e.key, e.entries)).true;
        }

        // 重複追加されないこと
        for (const e of entriesSet) {
            acl.addEntry(e.key, e.entries[0]);
            expect(acl.getEntries(e.key)).have.lengthOf(e.entries.length);
        }

        // エントリを削除できること
        for (const e of entriesSet) {
            const target = e.entries[0];
            const numBefore = acl.getEntries(e.key).length;
            acl.removeEntry(e.key, target);
            const numAfter = acl.getEntries(e.key).length;
            expect(numAfter).equal(numBefore - 1);
            expect(hasEntry(acl, e.key, target)).false;
        }

        // 存在しないエントリを削除しても無視されること。
        for (const e of entriesSet) {
            const target = e.entries[0];
            const numBefore = acl.getEntries(e.key).length;
            acl.removeEntry(e.key, target);
            const numAfter = acl.getEntries(e.key).length;
            expect(numAfter).equal(numBefore);
            expect(hasEntry(acl, e.key, target)).false;
        }

        // 全エントリ削除
        for (const e of entriesSet) {
            removeAllEntries(acl, e.key, e.entries);
            expect(acl.getEntries(e.key)).empty;
        }

        const OWNER = "514f36644f9cb2eb8000027";
        acl._setOwner(OWNER);
        expect(acl.getOwner(), "OWNERが取得できること").equal(OWNER);

        const user = new Nebula.User();
        user._id = "514f36644f9cb2eb8000028";
        let results = acl.addEntry(Nebula.Acl.READ, user);
        expect(results && hasEntry(acl, Nebula.Acl.READ, user._id), "addEntry()のエントリにNebula.Userインスタンスを指定できること").true;
        acl.removeEntry(Nebula.Acl.READ, user);
        expect(hasEntry(acl, Nebula.Acl.READ, user._id), "removeEntry()のエントリにNebula.Userインスタンスを指定できること").false;

        const group = new Nebula.Group("qunitGroup_A");
        results = acl.addEntry(Nebula.Acl.WRITE, group);
        expect(results && hasEntry(acl, Nebula.Acl.WRITE, "g:" + group.groupname), "addEntry()のエントリにNebula.Groupインスタンスを指定できること").true;
        acl.removeEntry(Nebula.Acl.WRITE, group);
        expect(hasEntry(acl, Nebula.Acl.WRITE, "g:" + group.groupname), "removeEntry()のエントリにNebula.Groupインスタンスを指定できること").false;

        results = acl.addEntry(Nebula.Acl.CREATE, Nebula.Acl.AUTHENTICATED);
        expect(results && hasEntry(acl, Nebula.Acl.CREATE, Nebula.Acl.AUTHENTICATED), "addEntry()のエントリにNebula.Acl.AUTHENTICATEDを指定できること").true;
        acl.removeEntry(Nebula.Acl.CREATE, Nebula.Acl.AUTHENTICATED);
        expect(hasEntry(acl, Nebula.Acl.CREATE, Nebula.Acl.AUTHENTICATED), "removeEntry()のエントリにNebula.Acl.AUTHENTICATEDを指定できること").false;

        results = acl.addEntry(Nebula.Acl.UPDATE, Nebula.Acl.ANONYMOUS);
        expect(results && hasEntry(acl, Nebula.Acl.UPDATE, Nebula.Acl.ANONYMOUS), "addEntry()のエントリにNebula.Acl.ANONYMOUSを指定できること").true;
        acl.removeEntry(Nebula.Acl.UPDATE, Nebula.Acl.ANONYMOUS);
        expect(hasEntry(acl, Nebula.Acl.UPDATE, Nebula.Acl.ANONYMOUS), "removeEntry()のエントリにNebula.Acl.ANONYMOUSを指定できること").false;

        expect(acl.addEntry("unknown permission", "USER_A"), "addEntry()で不正なpermissionが設定された(falseが返ること)").false;
        expect(acl.addEntry(Nebula.Acl.READ, null), "addEntry()でエントリにnullが設定された(falseが返ること)").false;
        expect(acl.addEntry(Nebula.Acl.WRITE, undefined), "addEntry()でエントリが指定されていない(falseが返ること)").false;

        expect(acl.removeEntry("unknown permission", "USER_A"), "removeEntry()で不正なpermissionが設定された(何も起きないこと)").false;
        expect(acl.removeEntry(Nebula.Acl.CREATE, null), "removeEntry()でエントリにnullが設定された(何も起きないこと)").false;
        expect(acl.removeEntry(Nebula.Acl.UPDATE, undefined), "removeEntry()でエントリが指定されていない(何も起きないこと)").false;
    });

    it("Nebula.Acl: ACLイスタンス生成時にJSONオブジェクトを渡したときにエントリが正しいこと", () => {
        const jsonAcl = {
            "owner": "owner_user",
            "r": ["g:authenticated", "read_user"],
            "w": ["write_user"],
            "admin": ["admin_user_1", "admin_user_2"]
        };
        const acl = new Nebula.Acl(jsonAcl);
        
        expect(hasEntry(acl, Nebula.Acl.READ, Nebula.Acl.AUTHENTICATED)).true;
        expect(hasEntry(acl, Nebula.Acl.READ, "read_user")).true;
        expect(acl.getEntries(Nebula.Acl.READ)).lengthOf(2);
        expect(hasEntry(acl, Nebula.Acl.WRITE, "write_user")).true;
        expect(acl.getEntries(Nebula.Acl.WRITE)).lengthOf(1);
        expect(hasEntry(acl, Nebula.Acl.ADMIN, "admin_user_1")).true;
        expect(hasEntry(acl, Nebula.Acl.ADMIN, "admin_user_2")).true;
        expect(acl.getEntries(Nebula.Acl.ADMIN)).lengthOf(2);
        expect(acl.getEntries(Nebula.Acl.CREATE)).empty;
        expect(acl.getEntries(Nebula.Acl.UPDATE)).empty;
        expect(acl.getEntries(Nebula.Acl.DELETE)).empty;
        expect(acl.getOwner()).equal("owner_user");
    });

});
