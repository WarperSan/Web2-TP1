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
                success: (data) => {
                    resolve(data);
                },
                error: (xhr) => {
                    resolve({
                        isError: true,
                        message: xhr.responseJSON.error_description
                    });
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