class Posts_API {
    static API_URL() {
        return window.location.origin + "/api/posts"
    };

    static async HEAD() {
        return new Promise(resolve => {
            $.ajax({
                url: this.API_URL(),
                type: 'HEAD',
                contentType: 'text/plain',
                complete: data => {
                    resolve(data.getResponseHeader('ETag'));
                },
                error: (xhr) => {
                    console.log(`Error while calling '${this.API_URL()}' (HEAD): ` + xhr.status);
                    resolve(null);
                }
            });
        });
    }

    static async Get(queryString = undefined) {
        return new Promise(resolve => {
            $.ajax({
                url: this.API_URL() + (queryString ? "?" + queryString : ""),
                complete: data => {
                    resolve({ETag: data.getResponseHeader('ETag'), data: data.responseJSON});
                },
                //success: data => { resolve(data); },
                error: (xhr) => {
                    console.log(xhr);
                    resolve(null);
                }
            });
        });
    }

    static async Save(data, create = true) {
        return new Promise(resolve => {
            $.ajax({
                url: create ? this.API_URL() : this.API_URL() + "/" + data.Id,
                type: create ? "POST" : "PUT",
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: (/*data*/) => {
                    resolve(true);
                },
                error: (/*xhr*/) => {
                    resolve(false /*xhr.status*/);
                }
            });
        });
    }

    static async Delete(id) {
        return new Promise(resolve => {
            $.ajax({
                url: this.API_URL() + "/" + id,
                type: "DELETE",
                success: () => {
                    resolve(true);
                },
                error: (/*xhr*/) => {
                    resolve(false /*xhr.status*/);
                }
            });
        });
    }
}

class PostsManager {

    constructor(itemRender, categoryRender) {
        this.#itemRender = itemRender;
        this.#categoryRender = categoryRender;

        setInterval(() => {
            // noinspection JSIgnoredPromiseFromCall
            this.#updateRender(false);
        }, 1000);
    }

    #itemRender = undefined;
    #itemsETag = undefined;
    #loadedItems = undefined;

    #categoryRender = undefined;
    #loadedCategories = undefined;

    async #updateRender(forced) {
        // If no callback given, skip
        if (!this.#itemRender)
            return false;

        // Get ETag
        let etag = await Posts_API.HEAD();

        // If errored, skip
        if (etag === null)
            return false;

        // If not forced and the items didn't change, skip
        if (!forced && etag === this.#itemsETag)
            return false;

        // Get items
        let items = await this.#getItems();

        // Render items
        this.#itemRender(items);

        // Update ETag
        this.#itemsETag = etag;

        // If callback given, update
        if (this.#categoryRender) {
            // Get categories
            let categories = await this.#getCategories();

            // Render categories
            this.#categoryRender(categories);
        }

        return true;
    }

    /** Fetches all the items that meet the current conditions */
    async #getItems() {
        // Build Query
        let query = [
            "sort=creation,desc",
        ];

        if (this.#categories !== undefined)
            query.push("category=(" + this.#categories.join("|") + ")");

        if (this.#keywords !== undefined)
            query.push("keywords=" + this.#keywords);

        let queryString = query.length === 0 ? undefined : query.join("&");

        // Fetch items
        let items = await Posts_API.Get(queryString);

        // If errored, reset loaded
        if (items === null)
            this.#loadedItems = undefined;
        else
            this.#loadedItems = items.data;

        return this.#loadedItems;
    }

    /** Fetches all the categories */
    async #getCategories() {
        // Fetch categories
        let categories = await Posts_API.Get("fields=category&sort=category");

        // If errored, clear all
        if (categories === null) {
            this.#loadedCategories = undefined;
            this.#categories = undefined;
            return undefined;
        }

        // Compile categories
        this.#loadedCategories = [...new Set(categories.data.map(i => i.Category))];

        // Remove invalid categories
        if (this.#categories)
            this.#categories = this.#categories.filter(c => this.#loadedCategories.indexOf(c) !== -1);
        else
            this.#categories = undefined;

        return this.#loadedCategories;
    }

    #categories = undefined;

    /** Sets the categories of the search and updates the items */
    setCategories(categories) {
        this.#categories = categories;
        return this.#updateRender(true);
    }

    #keywords = undefined;

    /** Sets the search terms of the search and updates the items */
    setSearch(searchString) {

        searchString = searchString.trim();
        if (searchString === '')
            this.#keywords = undefined;
        else
            this.#keywords = searchString;
        return this.#updateRender(true);
    }

    /** Edits the item with the given ID and overrides the given values */
    editItem(id, data) {
        // If not item loaded, skip
        if (this.#loadedItems === undefined)
            return false;

        let items = this.#loadedItems.filter(i => i.Id === id);

        // If not found, skip
        if (items.length === 0)
            return false;

        let item = {...items[0], ...data};
        item.Id = id;

        let imageSplit = item.Image.split('/');
        item.Image = imageSplit[imageSplit.length - 1];

        return Posts_API.Save(item, false);
    }
}