---
layout: post
title: Setting Up Personal Website with GitHub Pages and Jekyll
date: 2025-05-17 12:00:00 -0700
categories: [tech]
tags: [github-pages, jekyll, web, dns]
---

This website was setup using GitHub Pages and Jekyll

## Stack

- **GitHub Pages** - Hosts the website directly from my GitHub repository
- **Jekyll** - Static site generator that converts Markdown files into a website
- **Dark Poole** - A dark Jekyll theme

## Cost
- 12 dollars a year as of May 2025

## How it works
1. The code repo is on GitHub
2. When changes are pushed, GitHub runs some Actions to build the site and deploys it to github pages. 
3. I pay for the domain name on cloudflare now, which is only 12 dollars a year!? (For context, when I first got the custom domain it was from somewhere else, I didn't know you don't have to stick with the same DNS registrar forever. So later I shopped around and cloudflare is cheaper than what I was paying). I also set it up with their free CDN product:

   Why do people use CDNs? They:
   - Cache your content at servers around the world, reducing load times for visitors
   - Protect against DDoS attacks by absorbing malicious traffic
   - Provide SSL/TLS encryption for secure connections
   - Often include features like image optimization and minification
   - Can save bandwidth costs on your origin server

   CDN's Drawbacks:
   - Cache invalidation can be tricky (sometimes you want to update content but the CDN keeps serving old versions)
   - Adding another point of failure in your infrastructure
   - Potential privacy concerns since CDN providers can see your traffic
   - Some features might require paid tiers
   - Complex DNS setup if not configured correctly

4. I probably didn't need a CDN (you don't pay for github pages hosting), but since its free, why not?

### Domain and DNS Setup

The DNS configuration for `tomlai.net` includes:
- Multiple A records pointing to GitHub Pages IPs:
  - 185.199.108.153
  - 185.199.109.153
  - 185.199.110.153
  - 185.199.111.153

See [GitHub's guide on configuring a custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site?versionId=free-pro-team%40latest&productId=pages&restPage=configuring-a-custom-domain-for-your-github-pages-site%2Cabout-custom-domains-and-github-pages) for detailed setup instructions.


## Development Workflow

1. Local development using:
   ```bash
   bundle exec jekyll serve
   ```
2. Preview changes at `http://localhost:4000`
3. Git push to deploy:
   ```bash
   git add .
   git commit -m "Update site content"
   git push
   ```
4. Changes propagate through:
   - GitHub Pages build system
   - Global CDN network
   - Usually takes 1-2 minutes for full deployment

## Pros and Cons

### Advantages
- **Mostly free** - I pay for the custom domain name but GitHub Pages hosting is free
- **Simple Deployment** - Push to main branch and it's live
- **Version Control** - Every change is tracked in Git
- **Static Site Performance** - Fast loading times, no database needed
- **Markdown Writing** - Focus on content without HTML complexity (not that I write that much, I should though)
- **Build Process** - Jekyll handles all asset optimization
- **Security** - No server-side code means minimal attack surface

### Disadvantages
- **Static Only** - No server-side processing or dynamic content
- **Plugin Restrictions** - Only approved Jekyll plugins allowed
- **No Server Features** - Can't handle form submissions or user data

The source code for this website is available on [GitHub](https://github.com/tomtclai/tomlai.net) if you'd like to see how it's built. 
