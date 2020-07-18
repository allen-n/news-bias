// Shared utility functions
function url2Domain(url) {
    var domain = url.replace(/^https?:\/\//, ''); // Strip off https:// and/or http://
    domain = domain.replace(/^[a-zA-Z]*\./, ''); // Strip off anything before the first .
    domain = domain.split('/')[0]; // Get the domain and just the domain (not the path)
    return domain
}