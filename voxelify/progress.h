#ifndef PROGRESS_H
#define PROGRESS_H

#include <iostream>

using namespace std;

class Progress {
public:
	Progress(int maximum, bool verbose): verbose(verbose), maximum(maximum), current(0) {}
	void step(int amount = 1) {
		current += amount;
		if(verbose)
			cout << current << "/" << maximum << endl;
	}
private:
	int maximum, current;
	bool verbose;
};

#endif