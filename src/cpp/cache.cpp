#include <iostream>
#include <unordered_map>
#include <list>
using namespace std;

class LRUCache {
private:
    int capacity;
    int hits = 0;
    int misses = 0;
    list<int> usage;
    unordered_map<int, pair<int, list<int>::iterator>> cache;

public:
    LRUCache(int cap) {
        capacity = cap;
    }

    int get(int key) {
        if (cache.find(key) == cache.end()) {
            misses++;
            return -1;
        }

        hits++;

        usage.erase(cache[key].second);
        usage.push_front(key);
        cache[key].second = usage.begin();

        return cache[key].first;
    }

    void put(int key, int value) {
        if (cache.find(key) != cache.end()) {
            usage.erase(cache[key].second);
        } else if (cache.size() >= capacity) {
            int leastUsed = usage.back();
            usage.pop_back();
            cache.erase(leastUsed);
        }

        usage.push_front(key);
        cache[key] = {value, usage.begin()};
    }

    void printCache() {
        for (int key : usage) {
            cout << key << " ";
        }

        cout << endl;
    }

    void printStats() {
        cout << "Hits: " << hits << endl;
        cout << "Misses: " << misses << endl;
    }
};
