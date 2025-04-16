<script lang="ts">
    import Row from "./row.svelte";
    import { type INode } from "./types";

    export let data = {
        id: 0,
        title: "",
        final: true,
        text: "",
        icon: "",
        children: [],
    } as INode;
    const self = arguments[0].__proto__.constructor;
</script>

<div>
    <Row {data}></Row>
    <div>
        {#each data?.children as child}
            <svelte:component this={self} data={child} />
        {/each}
    </div>
</div>
