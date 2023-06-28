
function msConversion(millis) {
    const d = new Date(Date.UTC(0, 0, 0, 0, 0, 0, millis)),
        // Pull out parts of interest
        parts = [
            d.getUTCHours(),
            d.getUTCMinutes(),
            d.getUTCSeconds()
        ];

    // Zero-pad
    let output = "";

    if (parts[0]) {
        output += parts[0] + " hours ";
    }


    if (parts[1]) {
        output += parts[1] + " minutes ";
    }

    if (parts[2]) {
        output += parts[2] + " seconds ";
    }

    return output
}

const units = ['bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

function niceBytes(x) {

    let l = 0, n = parseInt(x, 10) || 0;

    while (n >= 1024 && ++l) {
        n = n / 1024;
    }

    return (n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l]);
}

export function roughSizeOfObject(object) {
    const objectList = [];
    const stack = [object];
    const bytes = [0];
    while (stack.length) {
        const value = stack.pop();
        if (value == null) bytes[0] += 4;
        else if (typeof value === 'boolean') bytes[0] += 4;
        else if (typeof value === 'string') bytes[0] += value.length * 2;
        else if (typeof value === 'number') bytes[0] += 8;
        else if (typeof value === 'object' && objectList.indexOf(value) === -1) {
            objectList.push(value);
            if (typeof value.byteLength === 'number') bytes[0] += value.byteLength;
            else if (value[Symbol.iterator]) {
                // eslint-disable-next-line no-restricted-syntax
                for (const v of value) stack.push(v);
            } else {
                Object.keys(value).forEach(k => {
                    bytes[0] += k.length * 2; stack.push(value[k]);
                });
            }
        }
    }
    return niceBytes(bytes[0]);
}

export function SluggifyPageTitle(title, content) {
    let slugged = slugify(title);
    let copies = content.filter(page => page.slug == slugged);
    if (copies.length > 0) {
        slugged += copies.length + 1;
    }

    return slugged;
}