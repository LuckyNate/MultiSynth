"use strict";

/*
 * MultiSynth Rack Neighborhood
 * ----------------------------
 * Local Game-of-Life-style routing semantics for the virtual rack grid.
 *
 * For a module at (row, col):
 *
 *   parents:  (row-1,col-1) (row-1,col) (row-1,col+1)
 *   siblings: (row,  col-1)               (row,  col+1)
 *   children: (row+1,col-1) (row+1,col) (row+1,col+1)
 *
 * Parents feed downward into the module. Siblings occupy the same synthesis level
 * and are parallel peers. Children inherit downward from the module.
 * A child may therefore inherit from at most three side-by-side parents.
 */
(function (global) {
    function key(row, col) { return row + ":" + col; }

    function createNeighborhoodResolver(getInstances) {
        function index() {
            const map = new Map();
            for (const i of getInstances()) {
                if (!i || i.enabled === false) continue;
                map.set(key(i.row, i.col), i);
            }
            return map;
        }

        function at(map, row, col) {
            return map.get(key(row, col)) || null;
        }

        function neighborhood(instanceOrId) {
            const all = getInstances();
            const self = typeof instanceOrId === "string"
                ? all.find(i => i.id === instanceOrId)
                : instanceOrId;
            if (!self) throw new Error("Unknown rack instance");

            const map = index();
            const parents = [
                at(map, self.row - 1, self.col - 1),
                at(map, self.row - 1, self.col),
                at(map, self.row - 1, self.col + 1)
            ].filter(Boolean);

            const siblings = [
                at(map, self.row, self.col - 1),
                at(map, self.row, self.col + 1)
            ].filter(Boolean);

            const children = [
                at(map, self.row + 1, self.col - 1),
                at(map, self.row + 1, self.col),
                at(map, self.row + 1, self.col + 1)
            ].filter(Boolean);

            return {
                self,
                parents,
                siblings,
                children,
                parentIds: parents.map(i => i.id),
                siblingIds: siblings.map(i => i.id),
                childIds: children.map(i => i.id)
            };
        }

        function topology() {
            const all = getInstances().filter(i => i && i.enabled !== false);
            const edges = [];
            const siblingPairs = [];
            const seenSibling = new Set();

            for (const i of all) {
                const n = neighborhood(i);
                for (const p of n.parents) {
                    edges.push({ from: p.id, to: i.id, relation: "parent-child" });
                }
                for (const s of n.siblings) {
                    const pair = [i.id, s.id].sort();
                    const id = pair.join("|");
                    if (!seenSibling.has(id)) {
                        seenSibling.add(id);
                        siblingPairs.push({ a: pair[0], b: pair[1], relation: "siblings" });
                    }
                }
            }

            return { edges, siblingPairs };
        }

        return Object.freeze({ neighborhood, topology });
    }

    global.MultiSynth = global.MultiSynth || {};
    global.MultiSynth.createRackNeighborhoodResolver = createNeighborhoodResolver;
})(window);
