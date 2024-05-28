const Recommender = require('./Recommender');

function generateBooleanPermutations(config) {
    const keys = Object.keys(config);
    const permutations = [];

    function generatePermutations(index, currentConfig) {
        if (index === keys.length) {
            permutations.push({...currentConfig});
            return;
        }

        const key = keys[index];
        currentConfig[key] = true;
        generatePermutations(index + 1, currentConfig);

        currentConfig[key] = false;
        generatePermutations(index + 1, currentConfig);
    }

    generatePermutations(0, {});

    return permutations;
}

const all_configs = {
    file_search: true,
    code_interpreter: false,
    assistant: true,
    embeddings: false
};

// elis
const useExisting = {
    "file_id": "file-6C9mlmzMVh13j37vZSk5Otdd",
    "thread_id": "thread_1oDrJU7YxDZyfFBffOGjn0l3",
    "assistant_id": "asst_rnWFLtAcoLy8wXq6dOsXd6w1",
    "vector_store_id": "vs_JzqdJ44BGj1XDUAHJgHyx0G7"
}

const recommender = new Recommender(Object.assign({}, all_configs));
return recommender.complete();


const perms = generateBooleanPermutations(all_configs);
perms.forEach(async (config) => {
    const recommender = new Recommender(Object.assign(config, useExisting));
    await recommender.complete();
});
