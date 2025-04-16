
import fs from 'file-system';

export interface INode {
    id: number;
    title: string;
    text: string;
    final: boolean;
    children: INode[];
}

const config = fs.readFileSync('./config.json', { encoding: 'utf8', flag: 'r' });

function getRandomString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

function getLinearInner(id): INode {
    return {
        id: id,
        title: getRandomString(10),
        text: getRandomString(30),
        final: true,
        children: []
    }
}

function getLinearCase(n): INode {
    const children = [];

    for (let i = 0; i !== n; i++) {
        children.push(getLinearInner(i + 1));
    }

    return {
        id: 0,
        title: `Test linear`,
        text: `Test case with N = ${n}`,
        final: false,
        children
    };
}

let _id = 0;

function getBinaryInner(n): INode[] {
    const half = Math.floor((n - 1) / 2);
    const rest = (n - 1) - half;

    if (n <= 0) {
        return [];
    } else if (n === 1) {
        return [{
            id: ++_id,
            title: getRandomString(10),
            text: getRandomString(30),
            final: true,
            children: []
        }];
    }

    return [{
        id: ++_id,
        title: getRandomString(10),
        text: getRandomString(30),
        final: n === 0,
        children: [
            ...getBinaryInner(half),
            ...getBinaryInner(rest)
        ]
    }];
}

function getBinaryCase(n): INode {
    _id = 0;
    return {
        id: 0,
        title: `Test binary`,
        text: `Test case with N = ${n}`,
        final: false,
        children: getBinaryInner(n)
    };
}

function getOuter(action, n, root) {
    return {
        type: action,
        childrenAmount: n,
        root
    }
}

const data = JSON.parse(config);
const testcases = data?.testCases || [];
const testsPerCase = data?.testsPerCase || 1;
const dirs = data?.dir || [];
const action = data?.action || '';

for (const dir of dirs) {
    for (let testcase of testcases) {
        for (let i = 0; i !== testsPerCase; i++) {
            const type = dir.substring(dir.lastIndexOf('/') + 1) || "linear";

            fs.writeFileSync(
                `${dir}/test.${testcase}.${1 + i}.json`,
                JSON.stringify(
                    getOuter(
                        action,
                        testcase,
                        type === "linear" ? getLinearCase(testcase) : getBinaryCase(testcase)
                    )
                )
            );
        }
    }
}

