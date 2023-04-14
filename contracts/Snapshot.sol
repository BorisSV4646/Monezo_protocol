// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Arrays.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./MonezoNFT.sol";

contract SnapshotMonezo is ERC721Monezo {
    using Arrays for uint256[];
    using Counters for Counters.Counter;

    struct Snapshots {
        uint256[] ids;
        uint256[] values;
    }

    mapping(address => Snapshots) private _accountBalanceSnapshots;
    mapping(uint256 => address[]) private _adressSnapshot;
    Snapshots private _totalSupplySnapshots;

    Counters.Counter private _currentSnapshotId;

    event Snapshot(uint256 id, address[] snap);

    function snapshot() public onlyCreater returns (uint256, address[] memory) {
        _currentSnapshotId.increment();

        uint256 currentId = _getCurrentSnapshotId();

        uint256 suplay = totalSupply();
        address[] memory snap = new address[](suplay);
        for (uint i = 1; i <= suplay; i++) {
            if (_ownerOf(i) != address(0)) {
                snap[i - 1] = _ownerOf(i);
            }
        }

        _adressSnapshot[currentId] = snap;

        emit Snapshot(currentId, snap);
        return (currentId, snap);
    }

    function showAddressSnap(
        uint256 idSnap
    ) public view returns (address[] memory) {
        return _adressSnapshot[idSnap];
    }

    function _getCurrentSnapshotId() internal view virtual returns (uint256) {
        return _currentSnapshotId.current();
    }

    function balanceOfAt(
        address account,
        uint256 snapshotId
    ) public view virtual returns (uint256) {
        (bool snapshotted, uint256 value) = _valueAt(
            snapshotId,
            _accountBalanceSnapshots[account]
        );

        return snapshotted ? value : balanceOf(account);
    }

    function totalSupplyAt(
        uint256 snapshotId
    ) public view virtual returns (uint256) {
        (bool snapshotted, uint256 value) = _valueAt(
            snapshotId,
            _totalSupplySnapshots
        );

        return snapshotted ? value : totalSupply();
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);

        if (from == address(0)) {
            // mint
            _updateAccountSnapshot(to);
            _updateTotalSupplySnapshot();
        } else if (to == address(0)) {
            // burn
            _updateAccountSnapshot(from);
            _updateTotalSupplySnapshot();
        } else {
            // transfer
            _updateAccountSnapshot(from);
            _updateAccountSnapshot(to);
        }
    }

    function _valueAt(
        uint256 snapshotId,
        Snapshots storage snapshots
    ) private view returns (bool, uint256) {
        require(snapshotId > 0, "ERC20Snapshot: id is 0");
        require(
            snapshotId <= _getCurrentSnapshotId(),
            "ERC20Snapshot: nonexistent id"
        );

        uint256 index = snapshots.ids.findUpperBound(snapshotId);

        if (index == snapshots.ids.length) {
            return (false, 0);
        } else {
            return (true, snapshots.values[index]);
        }
    }

    function _updateAccountSnapshot(address account) private {
        _updateSnapshot(_accountBalanceSnapshots[account], balanceOf(account));
    }

    function _updateTotalSupplySnapshot() private {
        _updateSnapshot(_totalSupplySnapshots, totalSupply());
    }

    function _updateSnapshot(
        Snapshots storage snapshots,
        uint256 currentValue
    ) private {
        uint256 currentId = _getCurrentSnapshotId();
        if (_lastSnapshotId(snapshots.ids) < currentId) {
            snapshots.ids.push(currentId);
            snapshots.values.push(currentValue);
        }
    }

    function _lastSnapshotId(
        uint256[] storage ids
    ) private view returns (uint256) {
        if (ids.length == 0) {
            return 0;
        } else {
            return ids[ids.length - 1];
        }
    }
}
