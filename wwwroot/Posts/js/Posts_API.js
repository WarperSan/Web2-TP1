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
                    console.log(xhr);
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

    constructor(renderCallback) {
        this.#renderCallback = renderCallback;

        setInterval(() => {
            // noinspection JSIgnoredPromiseFromCall
            this.#updateRender(false);
        }, 1000);
    }

    #renderCallback = undefined;
    #lastETag = undefined;
    #loadedItems = undefined;

    async #updateRender(forced) {
        // If no callback given, skip
        if (!this.#renderCallback)
            return false;

        // Get ETag
        let etag = await Posts_API.HEAD();

        // If errored, skip
        if (etag === null)
            return false;

        // If not forced and the items didn't change, skip
        if (!forced && etag === this.#lastETag)
            return false;

        // Get items
        let items = await this.getItems();

        // Render items
        this.#renderCallback(items);

        // Update ETag
        this.#lastETag = etag;

        return true;
    }

    /** Fetches all the items that meet the current conditions */
    async getItems() {
        // Build Query
        let query = [
            "sort=creation,desc",
        ];

        if (this.#categories !== undefined)
            query.push("category=" + this.#categories.join("|"));

        if (this.#words !== undefined) {
            let wordQuery = "*(" + this.#words.join("|") + ")*";
            query.push("title=" + wordQuery);
            //query.push("text=" + wordQuery);
        }

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

    #categories = undefined;

    /** Sets the categories of the search and updates the items */
    setCategories(categories) {
        this.#categories = categories;
        return this.#updateRender(true);
    }

    #words = undefined;

    /** Sets the search terms of the search and updates the items */
    setSearch(searchString) {
        this.#words = searchString.split(' ');
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