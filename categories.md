---
layout: page
title: Categories
permalink: /categories/
---



<ul>
  {% for category in site.categories %}
    {% assign cat_name = category[0] %}
    <li>
      <a href="/categories/{{ cat_name | slugify }}/">
        {{ cat_name }} ({{ category[1].size }})
      </a>
    </li>
  {% endfor %}
</ul>
