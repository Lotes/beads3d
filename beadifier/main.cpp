#include <iostream>
#include <string>
#include <boost/regex.hpp>
#include <fstream>

using namespace std;

class Object {
public:
	Object(const char* fileName) {
		ifstream infile(fileName);
		string line;
		while (getline(infile, line)) {
			if(line.length() == 0 || line[0] == '#')
				continue;
			boost::regex vertexPattern(".*v +([\\d|\\.|\\+|\\-|e|E]+) +([\\d|\\.|\\+|\\-|e|E]+) +([\\d|\\.|\\+|\\-|e|E]+).*");
			boost::match_results<std::string::const_iterator> match;
			if(boost::regex_match(line, match, vertexPattern)) {
				cout << match[1] << "|" << match[2] << "|" << match[3] << endl;
			} else
				cout << line << endl;
		}
	}
private:
	
};

int main() {
	Object obj("../models/example.obj");
	return 0;
}