type ObjectWithChildren<T> = T & { children: ObjectWithChildren<T>[] };
export function getAllChildren<Z>(
    root: ObjectWithChildren<Z>
): { target: ObjectWithChildren<Z>; familySize: number }[] {
    if (root.children.length) {
        const childs: { target: ObjectWithChildren<Z>; familySize: number }[] = [];
        for (const child of root.children) {
            childs.push(...getAllChildren<ObjectWithChildren<Z>>(child));
        }

        return [{ target: root, familySize: childs.length + 1 }, ...childs];
    } else {
        return [{ target: root, familySize: 1 }];
    }
}

export function targetObjectInTree<T, Z>(
    root: ObjectWithChildren<T>,
    targetKeyValue: Z[],
    key: keyof ObjectWithChildren<T>
): { target: ObjectWithChildren<T>; familySize: number }[] {
    return getAllChildren(root).reduce((acc: { target: ObjectWithChildren<T>; familySize: number }[], curr) => {
        // TODO: bypass typescript safe mechanism with 'as', find a type safe method to secure targetEntityInTree call
        const currentTargetKeyValue = Reflect.get(curr.target, key) as Z;
        if (targetKeyValue.includes(currentTargetKeyValue)) {
            const idsInAcc = acc.map((el) => Reflect.get(el.target, key));
            acc.push(
                ...getAllChildren(curr.target).filter((child) => !idsInAcc.includes(Reflect.get(child.target, key)))
            );
        }

        return acc;
    }, []);
}
