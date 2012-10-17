/*
 * Gitty - repository.js
 * Author: Gordon Hall
 * 
 * Primary repository class that exposes all repository level operations
 */

var fs = require('fs')
  , path = require('path')
  , Command = require('./command.js')
  , parse = require('../modules/output-parser.js')
  , Repository;

////
// Repository Constructor
////
Repository = function(repo) {
	// create assumed path to .git directory
	var repo_path = path.normalize(repo)
	  , split_path = repo_path.split('/');
	// determine if this is a valid repo
	this.isRepository = fs.existsSync(repo_path + '/.git');
	// set name as dir name
	this.name = split_path[split_path.length - 1];
	// set path
	this.path = repo_path;
};

////
// Repository.init(callback, [flags])
// Initializes the directory as a Git repository
////
Repository.prototype.init = function(callback, flags) {
	var gitInit = new Command(this.path, 'init', (flags || []), '')
	  , repo = this;
	gitInit.exec(function(error, stdout, stderr) {
		var err = error || stderr;
		callback.call(repo, err);
	});
};

////
// Repository.log(callback)
// Passes commit history as array to callback
////
Repository.prototype.log = function(callback) {
	var format = '--pretty=format:\'{"commit": "%H","author": "%an <%ae>","date": "%ad","message": "%s"},\''
	  , gitLog = new Command(this.path, 'log', [format], '')
	  , repo = this;
	gitLog.exec(function(error, stdout, stderr) {
		var output = stdout
		  , err = error || stderr;
		if (output) {
			output = parse['log'](output);
		}
		callback.call(repo, err, output);
	});
};

////
// Repository.status(callback)
// Passes a status object into the callack
////
Repository.prototype.status = function(callback) {
	var gitStatus = new Command(this.path, 'status', [], '')
	  , gitLsFiles = new Command(this.path, 'ls-files', ['--other','--exclude-standard'], '')
	  , repo = this;	
	gitStatus.exec(function(error, stdout, stderr) {
		var status = stdout
		  , err = error || stderr;
		gitLsFiles.exec(function(error, stdout, stderr) {
			var untracked = stdout;
			if (!err) {
				err = error || stderr;
			}
			status = parse['status'](status, untracked);
			callback.call(repo, err, status);
		});
	});
};

////
// Repository.add([files], callback)
// Stages the passed array of files for commit
////
Repository.prototype.add = function(files, callback) {
	var options = files.join(' ')
	  , gitAdd = new Command(this.path, 'add', [], options)
	  , repo = this;
	gitAdd.exec(function(error, stdout, stderr) {
		var err = error || stderr;
		callback.call(repo, err);
	});
};

////
// Repository.remove([files], callback)
// Removes the passed array of files for commit
////
Repository.prototype.remove = function(files, callback) {
	var options = files.join(' ')
	  , gitRm = new Command(this.path, 'rm', ['--cached'], options)
	  , repo = this;
	gitRm.exec(function(error, stdout, stderr) {
		var err = error || stderr;
		callback.call(repo, err);
	});
};

////
// Repository.unstage([files], callback)
// Removes passed array of files from staging area
////
Repository.prototype.unstage = function(files, callback) {
	var options = files.join(' ')
	  , gitUnstage = new Command(this.path, 'reset HEAD', [], options)
	  , repo = this;
	gitUnstage.exec(function(error, stdout, stderr) {
		var err = error || stderr;
		callback.call(repo, err);
	});
};

////
// Repository.commit(message, callback)
// Commits the current staged files
////
Repository.prototype.commit = function(message, callback) {
	var options = '"' + message + '"'
	  , gitCommit = new Command(this.path, 'commit', ['-m'], options)
	  , repo = this;
	gitCommit.exec(function(error, stdout, stderr) {
		var err = error || stderr
		  , data = (stdout) ? parse['commit'](stdout) : null;
		callback.call(repo, err, data);
	});
};

////
// Repository.branches(callback)
// Passes object denoting current branch and array of other branches
////
Repository.prototype.branches = function(callback) {
	var gitBranches = new Command(this.path, 'branch', [], '')
	  , repo = this;
	gitBranches.exec(function(error, stdout, stderr) {
		var err = error || stderr
		  , branches = parse['branch'](stdout);
		callback.call(this, err, branches);
	});
};

////
// Repository.branch(branch, callback)
// Creates a new branch from the given branch name
////
Repository.prototype.branch = function(name, callback) {
	var gitBranch = new Command(this.path, 'branch', [], name)
	  , repo = this;
	gitBranch.exec(function(error, stdout, stderr) {
		var err = error || stderr;
		callback.call(repo, err);
	});
};

////
// Repository.checkout(branch, callback)
// Performs checkout on given branch
////
Repository.prototype.checkout = function(branch, callback) {
	var gitCheckout = new Command(this.path, 'checkout', [], branch)
	  , repo = this;
	gitCheckout.exec(function(error, stdout, stderr) {
		var err = error || stderr;
		repo.branches(function(err, branches) {
			var branchesErr = err;
			callback.call(repo, err || branchesErr, branches);
		});
	});
};

////
// Repository.merge(branch, callback)
// Performs a merge of the current branch with the specified one
////
Repository.prototype.merge = function(branch, callback) {
	var gitMerge = new Command(this.path, 'merge', [], branch)
	  , repo = this;
	getMerge.exec(function(error, stdout, stderr) {
		var err = error || stderr;
		callback.call(repo, err);
	});
};

////
// Repository.remote
// Subset of methods for handling remotes
////
Repository.prototype.remote = {};

////
// Repository.remote.add(remote, url, callback)
// Adds a new remote
////
Repository.protoype.remote.add = function(remote, url, callback) {
	var options = remote + ' ' + url
	  , gitRemoteAdd = new Command(this.path, 'remote add', [], options)
	  , repo = this;
	gitRemoteAdd.exec(function(error, stdout, stderr) {
		var err = error || stderr;
		callback.call(repo, err);
	});
};

////
// Repository.remote.setUrl(remote, url, callback)
// Changes url of an existing remote
////
Repository.protoype.remote.setUrl = function(remote, url, callback) {
	var options = remote + ' ' + url
	  , gitRemoteSetUrl = new Command(this.path, 'remote set-url', [], options)
	  , repo = this;
	gitRemoteSetUrl.exec(function(error, stdout, stderr) {
		var err = error || stderr;
		callback.call(repo, err);
	});
};

////
// Repository.remote.remove(remote, callback)
// Removes the specified remote
////
Repository.prototype.remote.remove = function(remote, callback) {
	var gitRemoteRemove = new Command(this.path, 'remote rm', [], remote)
	  , repo = this;
	gitRemoteRemove.exec(function(error, stdout, stderr) {
		var err = error || stderr;
		callback.call(repo, err);
	});
};

////
// Repository.remote.list(callback)
// Passes key-value pairs to callback -> remote : url
////
Repository.prototype.remote.list = function(callback) {
	var gitRemoteList = new Command(this.path, 'remote', ['-v'], '')
	  , repo = this;
	gitRemoteList.exec(function(error, stdout, stderr) {
		var err = error || stderr
		  , output = stdout;
		if (output) {
			output = parse['remotes'](output);
		}
		callback.call(repo, err, output);
	});
};

// Export Constructor
module.exports = Repository;